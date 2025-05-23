"""FastAPI application setup and route configuration."""

from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from langserve import add_routes

from .auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    Token,
    User,
    authenticate_user,
    create_access_token,
    fake_users_db,
    get_current_active_user,
)
from .chains import (
    create_chatbot_chain,
    create_chatbot_chain_with_history,
    create_code_assistant_chain,
    create_creative_writer_chain,
    create_data_analyst_chain,
    create_research_assistant_chain,
)
from .config import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title="LangServe Backend for Socket.IO Frontend",
        version="1.0",
        description="Multiple AI agents accessible via LangServe",
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOW_ORIGINS,
        allow_credentials=settings.ALLOW_CREDENTIALS,
        allow_methods=settings.ALLOW_METHODS,
        allow_headers=settings.ALLOW_HEADERS,
    )

    # Setup LangServe routes
    _setup_routes(app)

    # Add health and info endpoints
    _setup_endpoints(app)

    return app


def _setup_routes(app: FastAPI) -> None:
    """Add all LangServe routes to the FastAPI app."""

    # General Chatbot
    add_routes(
        app,
        create_chatbot_chain(),
        path="/chatbot",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
        dependencies=[Depends(get_current_active_user)],
    )

    # General Chatbot with Persistence
    add_routes(
        app,
        create_chatbot_chain_with_history(),
        path="/chatbot-persistent",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
        dependencies=[Depends(get_current_active_user)],
    )

    # Code Assistant
    add_routes(
        app,
        create_code_assistant_chain(),
        path="/code-assistant",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
        dependencies=[Depends(get_current_active_user)],
    )

    # Data Analyst
    add_routes(
        app,
        create_data_analyst_chain(),
        path="/data-analyst",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
        dependencies=[Depends(get_current_active_user)],
    )

    # Creative Writer
    add_routes(
        app,
        create_creative_writer_chain(),
        path="/creative-writer",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
        dependencies=[Depends(get_current_active_user)],
    )

    # Research Assistant
    add_routes(
        app,
        create_research_assistant_chain(),
        path="/research-assistant",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
        dependencies=[Depends(get_current_active_user)],
    )


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
        return {
            "status": "healthy",
            "endpoints": [
                "/chatbot",
                "/chatbot-persistent",
                "/code-assistant",
                "/data-analyst",
                "/creative-writer",
                "/research-assistant",
            ],
            "version": "1.0",
            "auth_required": True,
        }

    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return {
            "message": "LangServe Backend for Socket.IO Frontend",
            "documentation": "/docs",
            "health": "/health",
            "available_agents": {
                "chatbot": {
                    "path": "/chatbot",
                    "description": "General-purpose conversational AI",
                    "playground": "/chatbot/playground",
                },
                "chatbot-persistent": {
                    "path": "/chatbot-persistent",
                    "description": "General-purpose conversational AI with memory persistence",
                    "playground": "/chatbot-persistent/playground",
                },
                "code-assistant": {
                    "path": "/code-assistant",
                    "description": "Specialized coding and development assistant",
                    "playground": "/code-assistant/playground",
                },
                "data-analyst": {
                    "path": "/data-analyst",
                    "description": "Data analysis and research with search tools",
                    "playground": "/data-analyst/playground",
                },
                "creative-writer": {
                    "path": "/creative-writer",
                    "description": "Creative writing and storytelling assistant",
                    "playground": "/creative-writer/playground",
                },
                "research-assistant": {
                    "path": "/research-assistant",
                    "description": "Research assistant with web search capabilities",
                    "playground": "/research-assistant/playground",
                },
            },
        }
