"""LangGraph compiled graph management for the application.

Note: We use the term "assistants" for user-facing API but these are
standard LangGraph StateGraphs compiled into Graph instances.
This is NOT LangGraph Platform assistants - we use open-source LangGraph only.
"""

import logging

from typing import Any, Dict, Optional

from langgraph.graph.graph import CompiledGraph

from .graphs import (
    create_chatbot_graph,
    create_chatbot_graph_with_checkpointing,
    create_code_assistant_graph,
    create_creative_writer_graph,
    create_data_analyst_graph,
    create_research_assistant_graph,
)


logger = logging.getLogger(__name__)


class GraphManager:
    """Manages LangGraph compiled graphs (user-facing called 'assistants').

    This class manages StateGraph instances compiled into Graph objects.
    We use open-source LangGraph only - no LangGraph Platform dependency.
    """

    def __init__(self):
        """Initialize the assistant manager."""
        self.assistants: Dict[str, CompiledGraph] = {}
        self.assistant_metadata: Dict[str, Dict[str, Any]] = {}
        self._initialize_assistants()

    def _initialize_assistants(self) -> None:
        """Initialize all available assistants."""
        try:
            # Chatbot assistant
            self.assistants["chatbot"] = create_chatbot_graph()
            self.assistant_metadata["chatbot"] = {
                "name": "General Chatbot",
                "description": "General-purpose conversational AI assistant",
                "type": "chat",
                "supports_streaming": True,
                "supports_persistence": False,
            }

            # Chatbot with persistence
            self.assistants["chatbot-persistent"] = (
                create_chatbot_graph_with_checkpointing()
            )
            self.assistant_metadata["chatbot-persistent"] = {
                "name": "Persistent Chatbot",
                "description": "General-purpose conversational AI with memory persistence",
                "type": "chat",
                "supports_streaming": True,
                "supports_persistence": True,
            }

            # Code assistant
            self.assistants["code-assistant"] = create_code_assistant_graph()
            self.assistant_metadata["code-assistant"] = {
                "name": "Code Assistant",
                "description": "Specialized coding and development assistant",
                "type": "chat",
                "supports_streaming": True,
                "supports_persistence": False,
            }

            # Creative writer
            self.assistants["creative-writer"] = create_creative_writer_graph()
            self.assistant_metadata["creative-writer"] = {
                "name": "Creative Writer",
                "description": "Creative writing and storytelling assistant",
                "type": "chat",
                "supports_streaming": True,
                "supports_persistence": False,
            }

            # Data analyst
            self.assistants["data-analyst"] = create_data_analyst_graph()
            self.assistant_metadata["data-analyst"] = {
                "name": "Data Analyst",
                "description": "Data analysis and research with search tools",
                "type": "chat",
                "supports_streaming": True,
                "supports_persistence": False,
                "has_tools": True,
            }

            # Research assistant
            self.assistants["research-assistant"] = create_research_assistant_graph()
            self.assistant_metadata["research-assistant"] = {
                "name": "Research Assistant",
                "description": "Research assistant with web search capabilities",
                "type": "chat",
                "supports_streaming": True,
                "supports_persistence": False,
                "has_tools": True,
            }

            logger.info(f"Initialized {len(self.assistants)} assistants")

        except Exception as e:
            logger.error(f"Failed to initialize assistants: {e}")
            raise

    def get_assistant(self, assistant_id: str) -> Optional[CompiledGraph]:
        """Get an assistant by ID.

        Args:
            assistant_id: The ID of the assistant to retrieve

        Returns:
            The compiled graph for the assistant, or None if not found
        """
        return self.assistants.get(assistant_id)

    def get_assistant_metadata(self, assistant_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for an assistant.

        Args:
            assistant_id: The ID of the assistant

        Returns:
            Metadata dictionary for the assistant, or None if not found
        """
        return self.assistant_metadata.get(assistant_id)

    def list_assistants(self) -> Dict[str, Dict[str, Any]]:
        """List all available assistants with their metadata.

        Returns:
            Dictionary mapping assistant IDs to their metadata
        """
        return self.assistant_metadata.copy()

    def health_check(self) -> Dict[str, Any]:
        """Perform a health check on all assistants.

        Returns:
            Health status for all assistants
        """
        health_status = {}

        for assistant_id, graph in self.assistants.items():
            try:
                # Try to access graph properties as a basic health check
                # This ensures the graph is properly initialized
                if hasattr(graph, "nodes"):
                    _ = graph.nodes
                health_status[assistant_id] = {"status": "healthy", "error": None}
            except Exception as e:
                health_status[assistant_id] = {"status": "unhealthy", "error": str(e)}
                logger.error(f"Health check failed for assistant {assistant_id}: {e}")

        return health_status


# Global assistant manager instance
assistant_manager = GraphManager()
