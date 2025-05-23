"""FastAPI application setup and route configuration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes

from .config import settings
from .chains import (
    create_chatbot_chain,
    create_code_assistant_chain,
    create_data_analyst_chain,
    create_creative_writer_chain,
    create_research_assistant_chain,
)


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
    )

    # Code Assistant
    add_routes(
        app,
        create_code_assistant_chain(),
        path="/code-assistant",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )

    # Data Analyst
    add_routes(
        app,
        create_data_analyst_chain(),
        path="/data-analyst",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )

    # Creative Writer
    add_routes(
        app,
        create_creative_writer_chain(),
        path="/creative-writer",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )

    # Research Assistant
    add_routes(
        app,
        create_research_assistant_chain(),
        path="/research-assistant",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )


def _setup_endpoints(app: FastAPI) -> None:
    """Add health and info endpoints."""
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "endpoints": [
                "/chatbot",
                "/code-assistant",
                "/data-analyst",
                "/creative-writer",
                "/research-assistant",
            ],
            "version": "1.0",
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