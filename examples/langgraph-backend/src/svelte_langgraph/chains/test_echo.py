"""Test echo agent for E2E testing without requiring API keys."""

from typing import Any, Dict

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda


# Note: MockEchoLLM class removed - it's not needed for the simple echo functionality
# The echo functionality is implemented directly in the create_echo_agent_chain function


def create_echo_agent_chain():
    """Create a test echo agent that doesn't require API keys.

    This agent simply echoes back the user's message with "Echo: " prefix.
    Perfect for E2E testing without needing real LLM providers.

    Returns:
        Configured echo agent chain
    """

    def echo_response(inputs: Dict[str, Any]) -> str:
        """Simple echo function that returns user input with Echo prefix."""
        messages = inputs.get("messages", [])

        # Find the last human message
        last_human_message = None
        for message in reversed(messages):
            if hasattr(message, "content") and hasattr(message, "type"):
                if message.type == "human":
                    last_human_message = message
                    break

        if last_human_message:
            return f"Echo: {last_human_message.content}"
        else:
            return "Echo: No message to echo"

    # Create a simple runnable that echoes input
    echo_runnable = RunnableLambda(echo_response)

    return echo_runnable


def create_echo_agent_chain_with_llm():
    """Create echo agent using the mock LLM for consistency with other agents.

    Returns:
        Configured echo agent chain using MockChatOpenAI from testing module
    """
    # Import here to avoid circular imports
    from ..testing import create_mock_openai

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a test echo agent. Simply echo back what the user says with 'Echo: ' prefix.",
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = create_mock_openai()
    chain = prompt | llm | StrOutputParser()

    return chain
