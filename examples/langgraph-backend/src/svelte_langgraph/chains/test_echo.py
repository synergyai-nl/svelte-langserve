"""Test echo agent for E2E testing without requiring API keys."""

from typing import Any, Dict, List

from langchain_core.language_models.base import BaseLanguageModel
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda


class MockEchoLLM(BaseLanguageModel):
    """Mock LLM that echoes back user input without requiring API keys.

    Perfect for E2E testing the full message flow.
    """

    def _generate(self, messages: List[BaseMessage], **kwargs: Any) -> Any:
        """Generate a response by echoing the last human message."""
        # Find the last human message
        last_human_message = None
        for message in reversed(messages):
            if isinstance(message, HumanMessage):
                last_human_message = message
                break

        if last_human_message:
            # Echo the message with a predictable format
            echo_response = f"Echo: {last_human_message.content}"
        else:
            echo_response = "Echo: No message to echo"

        # Return a simple response structure
        from langchain_core.generation import Generation
        from langchain_core.outputs import LLMResult

        generation = Generation(text=echo_response)
        return LLMResult(generations=[[generation]])

    async def _agenerate(self, messages: List[BaseMessage], **kwargs: Any) -> Any:
        """Async version of generate."""
        return self._generate(messages, **kwargs)

    def _llm_type(self) -> str:
        """Return the type of this LLM."""
        return "mock_echo"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        """Return identifying parameters."""
        return {"type": "mock_echo"}


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
        Configured echo agent chain using MockEchoLLM
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a test echo agent. Simply echo back what the user says with 'Echo: ' prefix.",
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = MockEchoLLM()
    chain = prompt | llm | StrOutputParser()

    return chain
