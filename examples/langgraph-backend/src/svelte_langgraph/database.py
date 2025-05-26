"""Database utilities for LangGraph checkpointing."""

import logging

from contextlib import contextmanager

from langgraph.checkpoint.memory import MemorySaver

from .config import settings


logger = logging.getLogger(__name__)


@contextmanager
def create_checkpointer_context():
    """Create a context manager for checkpointer that handles different database types."""
    # For testing or when in-memory DB is requested, use memory saver
    if settings.TESTING or settings.USE_IN_MEMORY_DB:
        logger.info("Using in-memory checkpointer for testing")
        yield MemorySaver()
        return

    # For production or when PostgreSQL is explicitly requested
    try:
        from langgraph.checkpoint.postgres import PostgresSaver

        logger.info(
            f"Using PostgreSQL checkpointer with URL: {settings.LANGGRAPH_DB_URL}"
        )
        with PostgresSaver.from_conn_string(settings.LANGGRAPH_DB_URL) as checkpointer:
            yield checkpointer

    except ImportError:
        logger.warning("PostgreSQL checkpointer not available, using memory saver")
        yield MemorySaver()
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        if settings.TESTING:
            logger.info("Falling back to memory saver for tests")
            yield MemorySaver()
        else:
            raise
