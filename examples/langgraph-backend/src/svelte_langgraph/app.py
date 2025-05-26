"""LangGraph application setup and assistant configuration."""

from datetime import timedelta
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, HTTPException, Path, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from .assistant_manager import assistant_manager
from .auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    Token,
    User,
    authenticate_user,
    create_access_token,
    fake_users_db,
    get_current_active_user,
)
from .config import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title="LangGraph Backend API",
        version="1.0.0",
        description="""
        REST API for the LangGraph Backend system providing access to multiple AI assistants.

        ## 🚨 Demo Authentication Notice

        This API currently uses **demo authentication** for proof of concept. Production
        deployments will use OAuth 2.0/OIDC providers instead of username/password authentication.

        **Available Demo Users:**
        - Username: `demo`, Password: `secret`
        - Username: `admin`, Password: `secret`

        ## 🤖 Available Assistants

        - **chatbot**: General-purpose conversational AI
        - **chatbot-persistent**: Chatbot with memory persistence
        - **code-assistant**: Programming help and code generation
        - **creative-writer**: Creative writing and storytelling
        - **data-analyst**: Data analysis with search tools
        - **research-assistant**: Web search and research capabilities

        ## 🔗 Additional Resources

        - [Socket.IO Events Documentation](https://github.com/synergyai-nl/svelte-langgraph/blob/main/docs/reference/api/socket-events.md)
        - [Authentication Workflow Guide](https://github.com/synergyai-nl/svelte-langgraph/blob/main/docs/guides/authentication-flow.md)
        - [Error Codes Reference](https://github.com/synergyai-nl/svelte-langgraph/blob/main/docs/reference/api/error-codes.md)
        """,
        contact={
            "name": "API Support",
            "url": "https://github.com/synergyai-nl/svelte-langgraph",
        },
        license_info={
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT",
        },
        openapi_tags=[
            {
                "name": "Authentication",
                "description": """
                Demo authentication endpoints for obtaining and validating JWT tokens.

                **Important:** This is demonstration authentication only. Production systems
                will use OAuth 2.0/OIDC providers instead.
                """,
            },
            {
                "name": "System",
                "description": "System information and health monitoring endpoints",
            },
            {
                "name": "Assistants",
                "description": "AI assistant management and invocation endpoints",
            },
        ],
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
    """Set up LangGraph assistant routes with enhanced documentation."""

    from langchain_core.messages import HumanMessage

    class AssistantRequest(BaseModel):
        """Request model for invoking an AI assistant."""

        message: str = Field(
            ...,
            description="User message to process",
            example="Explain quantum computing in simple terms",
        )
        thread_id: Optional[str] = Field(
            None,
            description="Thread ID for persistent assistants (maintains conversation context)",
            example="user123_thread_456",
        )
        config: Optional[Dict[str, Any]] = Field(
            None,
            description="Assistant configuration parameters",
            example={"temperature": 0.7, "max_tokens": 500, "top_p": 0.9},
        )

    class AssistantResponse(BaseModel):
        """Response model from an AI assistant."""

        response: str = Field(
            ...,
            description="Generated response from the assistant",
            example="Quantum computing is a revolutionary approach to computation...",
        )
        thread_id: Optional[str] = Field(
            None,
            description="Thread ID used (for persistent assistants)",
            example="user123_thread_456",
        )
        metadata: Optional[Dict[str, Any]] = Field(
            None,
            description="Additional response metadata",
            example={
                "assistant_id": "chatbot",
                "tokens_used": 150,
                "response_time_ms": 1250,
            },
        )

    @app.post(
        "/assistants/{assistant_id}/invoke",
        response_model=AssistantResponse,
        summary="Invoke an AI assistant",
        description="""
        Send a message to an AI assistant and receive a response.

        ## Configuration Options

        - **temperature**: Controls randomness (0.0-1.0)
        - **max_tokens**: Maximum response length
        - **top_p**: Nucleus sampling parameter
        - **frequency_penalty**: Penalize repeated tokens (-2.0 to 2.0)
        - **presence_penalty**: Penalize new topics (-2.0 to 2.0)

        ## Thread Management

        For persistent assistants (like `chatbot-persistent`), use consistent `thread_id`
        values to maintain conversation context across requests.

        ## Available Assistants

        - `chatbot`: General-purpose conversational AI
        - `chatbot-persistent`: Chatbot with memory persistence
        - `code-assistant`: Programming help and code generation
        - `creative-writer`: Creative writing and storytelling
        - `data-analyst`: Data analysis with search tools
        - `research-assistant`: Web search and research capabilities
        """,
        responses={
            200: {
                "description": "Assistant response generated successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "response": "Quantum computing is a revolutionary approach to computation that leverages the principles of quantum mechanics...",
                            "thread_id": "user123_thread_456",
                            "metadata": {
                                "assistant_id": "chatbot",
                                "tokens_used": 150,
                                "response_time_ms": 1250,
                            },
                        }
                    }
                },
            },
            400: {
                "description": "Invalid request parameters",
                "content": {
                    "application/json": {
                        "example": {"detail": "Message content cannot be empty"}
                    }
                },
            },
            401: {
                "description": "Authentication required",
                "content": {
                    "application/json": {
                        "example": {"detail": "Could not validate credentials"}
                    }
                },
            },
            404: {
                "description": "Assistant not found",
                "content": {
                    "application/json": {
                        "example": {"detail": "Assistant chatbot-invalid not found"}
                    }
                },
            },
            500: {
                "description": "Assistant invocation failed",
                "content": {
                    "application/json": {
                        "example": {
                            "detail": "Assistant invocation failed: Connection timeout"
                        }
                    }
                },
            },
        },
        tags=["Assistants"],
    )
    async def invoke_assistant(
        request: AssistantRequest,
        assistant_id: str = Path(
            ..., description="ID of the assistant to invoke", example="chatbot"
        ),
        current_user: User = Depends(get_current_active_user),
    ):
        """
        Invoke a LangGraph assistant with the provided message and configuration.

        This endpoint supports both simple one-off requests and persistent conversations
        using thread IDs for context management.
        """
        assistant = assistant_manager.get_assistant(assistant_id)
        if not assistant:
            raise HTTPException(
                status_code=404, detail=f"Assistant {assistant_id} not found"
            )

        try:
            # Prepare input for the graph
            input_data = {"messages": [HumanMessage(content=request.message)]}

            # Invoke the assistant
            metadata = assistant_manager.get_assistant_metadata(assistant_id) or {}
            if request.thread_id and metadata.get("supports_persistence"):
                # Use thread ID for persistent assistants
                from langchain_core.runnables import RunnableConfig

                config = RunnableConfig(configurable={"thread_id": request.thread_id})
                result = await assistant.ainvoke(input_data, config=config)
            else:
                result = await assistant.ainvoke(input_data)

            return AssistantResponse(
                response=result.get("response", ""),
                thread_id=request.thread_id,
                metadata={"assistant_id": assistant_id},
            )

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Assistant invocation failed: {str(e)}"
            )

    @app.get(
        "/assistants",
        summary="List all assistants",
        description="""
        Retrieve a list of all available AI assistants with their metadata.

        Returns information about each assistant including:
        - Name and description
        - Capabilities (streaming, persistence, tools)
        - Type and configuration options
        """,
        responses={
            200: {
                "description": "Assistants listed successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "chatbot": {
                                "name": "General Chatbot",
                                "description": "General-purpose conversational AI assistant",
                                "type": "chat",
                                "supports_streaming": True,
                                "supports_persistence": False,
                            },
                            "code-assistant": {
                                "name": "Code Assistant",
                                "description": "Specialized coding and development assistant",
                                "type": "chat",
                                "supports_streaming": True,
                                "supports_persistence": False,
                            },
                        }
                    }
                },
            },
            401: {
                "description": "Authentication required",
                "content": {
                    "application/json": {
                        "example": {"detail": "Could not validate credentials"}
                    }
                },
            },
        },
        tags=["Assistants"],
    )
    async def list_assistants(current_user: User = Depends(get_current_active_user)):
        """
        List all available AI assistants with their metadata and capabilities.
        """
        return assistant_manager.list_assistants()

    @app.get(
        "/assistants/{assistant_id}",
        summary="Get assistant information",
        description="""
        Retrieve detailed information about a specific assistant.

        Provides metadata including:
        - Assistant name and description
        - Supported features (streaming, persistence, tools)
        - Configuration options and limitations
        """,
        responses={
            200: {
                "description": "Assistant information retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "name": "General Chatbot",
                            "description": "General-purpose conversational AI assistant",
                            "type": "chat",
                            "supports_streaming": True,
                            "supports_persistence": False,
                        }
                    }
                },
            },
            401: {
                "description": "Authentication required",
                "content": {
                    "application/json": {
                        "example": {"detail": "Could not validate credentials"}
                    }
                },
            },
            404: {
                "description": "Assistant not found",
                "content": {
                    "application/json": {
                        "example": {"detail": "Assistant chatbot-invalid not found"}
                    }
                },
            },
        },
        tags=["Assistants"],
    )
    async def get_assistant_info(
        assistant_id: str = Path(
            ..., description="ID of the assistant", example="chatbot"
        ),
        current_user: User = Depends(get_current_active_user),
    ):
        """
        Get detailed information about a specific assistant including its capabilities.
        """
        metadata = assistant_manager.get_assistant_metadata(assistant_id)
        if not metadata:
            raise HTTPException(
                status_code=404, detail=f"Assistant {assistant_id} not found"
            )
        return metadata

    @app.get(
        "/assistants/{assistant_id}/health",
        summary="Check assistant health",
        description="""
        Check the health status of a specific assistant.

        Returns health information including:
        - Current status (healthy/unhealthy)
        - Error details if unhealthy
        - Last health check timestamp
        """,
        responses={
            200: {
                "description": "Health check completed",
                "content": {
                    "application/json": {
                        "example": {"status": "healthy", "error": None}
                    }
                },
            },
            401: {
                "description": "Authentication required",
                "content": {
                    "application/json": {
                        "example": {"detail": "Could not validate credentials"}
                    }
                },
            },
            404: {
                "description": "Assistant not found",
                "content": {
                    "application/json": {
                        "example": {"detail": "Assistant chatbot-invalid not found"}
                    }
                },
            },
        },
        tags=["Assistants"],
    )
    async def check_assistant_health(
        assistant_id: str = Path(
            ..., description="ID of the assistant to check", example="chatbot"
        ),
        current_user: User = Depends(get_current_active_user),
    ):
        """
        Check the health status of a specific assistant to ensure it's operational.
        """
        health_status = assistant_manager.health_check()
        if assistant_id not in health_status:
            raise HTTPException(
                status_code=404, detail=f"Assistant {assistant_id} not found"
            )
        return health_status[assistant_id]


def _setup_endpoints(app: FastAPI) -> None:
    """Add authentication, health and info endpoints with enhanced documentation."""

    @app.post(
        "/token",
        response_model=Token,
        summary="Get JWT access token",
        description="""
        Authenticate with username/password and receive a JWT access token.

        ## ⚠️ Demo Authentication Notice

        This is **demonstration authentication only**. Production systems will use
        OAuth 2.0/OIDC providers instead of username/password authentication.

        ## Available Demo Users

        - **Username**: `demo`, **Password**: `secret`
        - **Username**: `admin`, **Password**: `secret`

        ## Token Usage

        Include the returned token in the Authorization header for subsequent requests:
        ```
        Authorization: Bearer <access_token>
        ```

        Token expires after 60 minutes by default.
        """,
        responses={
            200: {
                "description": "Authentication successful",
                "content": {
                    "application/json": {
                        "example": {
                            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            "token_type": "bearer",
                        }
                    }
                },
            },
            401: {
                "description": "Invalid credentials",
                "content": {
                    "application/json": {
                        "example": {"detail": "Incorrect username or password"}
                    }
                },
            },
        },
        tags=["Authentication"],
    )
    async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
        """
        Demo authentication endpoint for obtaining JWT tokens.

        In production, this will be replaced with OAuth 2.0/OIDC flows.
        """
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

    @app.get(
        "/users/me",
        response_model=User,
        summary="Get current user information",
        description="""
        Retrieve information about the currently authenticated user.

        Returns user profile including:
        - Username and display name
        - Email address
        - Account status
        """,
        responses={
            200: {
                "description": "User information retrieved successfully",
                "content": {
                    "application/json": {
                        "example": {
                            "username": "demo",
                            "email": "demo@example.com",
                            "full_name": "Demo User",
                            "disabled": False,
                        }
                    }
                },
            },
            401: {
                "description": "Invalid or missing token",
                "content": {
                    "application/json": {
                        "example": {"detail": "Could not validate credentials"}
                    }
                },
            },
        },
        tags=["Authentication"],
    )
    async def read_users_me(current_user: User = Depends(get_current_active_user)):
        """
        Get information about the currently authenticated user from their JWT token.
        """
        return current_user

    @app.get(
        "/health",
        summary="System health check",
        description="""
        Get overall system health status including all assistants.

        Returns comprehensive health information:
        - Overall system status (healthy/degraded)
        - List of available assistants
        - Individual assistant health status
        - System version and configuration
        """,
        responses={
            200: {
                "description": "Health check completed",
                "content": {
                    "application/json": {
                        "example": {
                            "status": "healthy",
                            "assistants": [
                                "chatbot",
                                "chatbot-persistent",
                                "code-assistant",
                                "creative-writer",
                                "data-analyst",
                                "research-assistant",
                            ],
                            "assistant_health": {
                                "chatbot": {"status": "healthy", "error": None},
                                "code-assistant": {"status": "healthy", "error": None},
                            },
                            "version": "1.0",
                            "auth_required": True,
                            "backend_type": "langgraph",
                        }
                    }
                },
            }
        },
        tags=["System"],
    )
    async def health_check():
        """
        Comprehensive health check for the LangGraph backend system.

        Checks all assistant availability and returns overall system status.
        """
        assistant_health = assistant_manager.health_check()
        overall_status = (
            "healthy"
            if all(
                status["status"] == "healthy" for status in assistant_health.values()
            )
            else "degraded"
        )

        return {
            "status": overall_status,
            "assistants": list(assistant_health.keys()),
            "assistant_health": assistant_health,
            "version": "1.0",
            "auth_required": True,
            "backend_type": "langgraph",
        }

    @app.get(
        "/",
        summary="API information",
        description="""
        Get API information and available endpoints.

        Provides a comprehensive overview including:
        - Available assistants with capabilities
        - API endpoint URLs
        - Documentation links
        - System configuration
        """,
        responses={
            200: {
                "description": "API information retrieved",
                "content": {
                    "application/json": {
                        "example": {
                            "message": "LangGraph Backend API",
                            "documentation": "/docs",
                            "health": "/health",
                            "backend_type": "langgraph",
                            "available_assistants": {
                                "chatbot": {
                                    "name": "General Chatbot",
                                    "description": "General-purpose conversational AI assistant",
                                    "endpoint": "/assistants/chatbot/invoke",
                                    "info_endpoint": "/assistants/chatbot",
                                    "health_endpoint": "/assistants/chatbot/health",
                                    "supports_streaming": True,
                                    "supports_persistence": False,
                                }
                            },
                            "api_endpoints": {
                                "list_assistants": "/assistants",
                                "invoke_assistant": "/assistants/{assistant_id}/invoke",
                                "assistant_info": "/assistants/{assistant_id}",
                                "assistant_health": "/assistants/{assistant_id}/health",
                            },
                        }
                    }
                },
            }
        },
        tags=["System"],
    )
    async def root():
        """
        Root endpoint providing API information and available assistants overview.
        """
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
            "message": "LangGraph Backend API",
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
