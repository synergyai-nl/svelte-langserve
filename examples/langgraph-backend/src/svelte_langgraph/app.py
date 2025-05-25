"""LangGraph application setup and assistant configuration."""

from datetime import timedelta
from typing import Dict, Any

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from .auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    Token,
    User,
    authenticate_user,
    create_access_token,
    fake_users_db,
    get_current_active_user,
)
from .assistant_manager import assistant_manager
from .config import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title="LangGraph Backend for Socket.IO Frontend",
        version="1.0",
        description="Multiple AI assistants accessible via LangGraph",
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOW_ORIGINS,
        allow_credentials=settings.ALLOW_CREDENTIALS,
        allow_methods=settings.ALLOW_METHODS,
        allow_headers=settings.ALLOW_HEADERS,
    )

    # Setup assistant routes
    _setup_assistant_routes(app)

    # Add health and info endpoints
    _setup_endpoints(app)

    return app


def _setup_assistant_routes(app: FastAPI) -> None:
    """Set up LangGraph assistant routes."""
    
    from fastapi import Request
    from langchain_core.messages import HumanMessage
    from pydantic import BaseModel
    from typing import List, Optional
    
    class AssistantRequest(BaseModel):
        message: str
        thread_id: Optional[str] = None
        config: Optional[Dict[str, Any]] = None
    
    class AssistantResponse(BaseModel):
        response: str
        thread_id: Optional[str] = None
        metadata: Optional[Dict[str, Any]] = None
    
    @app.post("/assistants/{assistant_id}/invoke", response_model=AssistantResponse)
    async def invoke_assistant(
        assistant_id: str,
        request: AssistantRequest,
        current_user: User = Depends(get_current_active_user)
    ):
        """Invoke a LangGraph assistant."""
        assistant = assistant_manager.get_assistant(assistant_id)
        if not assistant:
            raise HTTPException(status_code=404, detail=f"Assistant {assistant_id} not found")
        
        try:
            # Prepare input for the graph
            input_data = {
                "messages": [HumanMessage(content=request.message)]
            }
            
            # Invoke the assistant
            metadata = assistant_manager.get_assistant_metadata(assistant_id) or {}
            if request.thread_id and metadata.get("supports_persistence"):
                # Use thread ID for persistent assistants
                result = await assistant.ainvoke(input_data, config={"thread_id": request.thread_id})
            else:
                result = await assistant.ainvoke(input_data)
            
            return AssistantResponse(
                response=result.get("response", ""),
                thread_id=request.thread_id,
                metadata={"assistant_id": assistant_id}
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Assistant invocation failed: {str(e)}")
    
    @app.get("/assistants")
    async def list_assistants(current_user: User = Depends(get_current_active_user)):
        """List all available assistants."""
        return assistant_manager.list_assistants()
    
    @app.get("/assistants/{assistant_id}")
    async def get_assistant_info(
        assistant_id: str, 
        current_user: User = Depends(get_current_active_user)
    ):
        """Get information about a specific assistant."""
        metadata = assistant_manager.get_assistant_metadata(assistant_id)
        if not metadata:
            raise HTTPException(status_code=404, detail=f"Assistant {assistant_id} not found")
        return metadata
    
    @app.get("/assistants/{assistant_id}/health")
    async def check_assistant_health(
        assistant_id: str,
        current_user: User = Depends(get_current_active_user)
    ):
        """Check the health of a specific assistant."""
        health_status = assistant_manager.health_check()
        if assistant_id not in health_status:
            raise HTTPException(status_code=404, detail=f"Assistant {assistant_id} not found")
        return health_status[assistant_id]


def _setup_endpoints(app: FastAPI) -> None:
    """Add health and info endpoints."""

    @app.post("/token", response_model=Token)
    async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
        """Login endpoint to get access token."""
        user = authenticate_user(fake_users_db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    @app.get("/users/me", response_model=User)
    async def read_users_me(current_user: User = Depends(get_current_active_user)):
        """Get current user information."""
        return current_user

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        assistant_health = assistant_manager.health_check()
        overall_status = "healthy" if all(
            status["status"] == "healthy" for status in assistant_health.values()
        ) else "degraded"
        
        return {
            "status": overall_status,
            "assistants": list(assistant_health.keys()),
            "assistant_health": assistant_health,
            "version": "1.0",
            "auth_required": True,
            "backend_type": "langgraph",
        }

    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        assistants = assistant_manager.list_assistants()
        
        # Transform assistant metadata for API response
        available_assistants = {}
        for assistant_id, metadata in assistants.items():
            available_assistants[assistant_id] = {
                "name": metadata["name"],
                "description": metadata["description"],
                "endpoint": f"/assistants/{assistant_id}/invoke",
                "info_endpoint": f"/assistants/{assistant_id}",
                "health_endpoint": f"/assistants/{assistant_id}/health",
                "supports_streaming": metadata.get("supports_streaming", False),
                "supports_persistence": metadata.get("supports_persistence", False),
            }
        
        return {
            "message": "LangGraph Backend for Socket.IO Frontend",
            "documentation": "/docs",
            "health": "/health",
            "backend_type": "langgraph",
            "available_assistants": available_assistants,
            "api_endpoints": {
                "list_assistants": "/assistants",
                "invoke_assistant": "/assistants/{assistant_id}/invoke",
                "assistant_info": "/assistants/{assistant_id}",
                "assistant_health": "/assistants/{assistant_id}/health",
            },
        }
