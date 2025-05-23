"""Main entry point for the Claude Dashboard Backend."""

import uvicorn

from .app import create_app
from .config import settings


def run_server():
    """Run the server with configured settings."""
    app = create_app()
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        log_level=settings.LOG_LEVEL,
    )


if __name__ == "__main__":
    run_server()