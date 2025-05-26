"""Memory store configuration for chat persistence."""

import os

from typing import Optional

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_postgres import PostgresChatMessageHistory


class MemoryStore:
    """Memory store for managing chat persistence."""

    def __init__(self, connection_string: Optional[str] = None):
        """Initialize memory store with database connection.

        Args:
            connection_string: PostgreSQL connection string. If None, uses environment variable.
        """
        self.connection_string = connection_string or os.getenv(
            "POSTGRES_CONNECTION_STRING",
            "postgresql://postgres:password@localhost:5432/chat_history",
        )

    def get_session_history(self, session_id: str) -> BaseChatMessageHistory:
        """Get chat history for a session.

        Args:
            session_id: Unique identifier for the chat session

        Returns:
            Chat message history for the session
        """
        return PostgresChatMessageHistory(
            connection=self.connection_string,
            session_id=session_id,
            table_name="message_store",
        )

    def create_with_history(self, chain, input_messages_key: str = "messages"):
        """Create a runnable with message history.

        Args:
            chain: The base chain to wrap with history
            input_messages_key: Key for input messages in the chain

        Returns:
            Chain wrapped with message history persistence
        """
        return RunnableWithMessageHistory(
            chain,
            self.get_session_history,
            input_messages_key=input_messages_key,
            history_messages_key="messages",
        )


# Global memory store instance
memory_store = MemoryStore()
