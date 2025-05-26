"""Mock LLM implementations for testing without external API dependencies."""

import asyncio
import os

from typing import Any, AsyncIterator, Dict, Iterator, List, Optional

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import Field


class MockChatOpenAI(BaseChatModel):
    """Mock ChatOpenAI implementation for testing.

    Provides predictable responses without requiring actual OpenAI API calls.
    Supports both sync and async operations, including streaming.
    """

    model: str = Field(default="gpt-4-mock", description="Model name")
    temperature: float = Field(default=0.7, description="Temperature for generation")

    @property
    def _llm_type(self) -> str:
        """Return the type of this LLM."""
        return "mock-openai"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        """Return identifying parameters."""
        return {
            "model": self.model,
            "temperature": self.temperature,
            "mock": True,
        }

    def _generate_mock_response(self, messages: List[BaseMessage]) -> str:
        """Generate a predictable mock response based on the input."""
        if not messages:
            return "Mock response: No messages provided"

        last_message = messages[-1]
        user_content = getattr(last_message, "content", "")

        # Provide context-aware mock responses
        if "code" in user_content.lower() or "python" in user_content.lower():
            return f"Mock code response: Here's a Python solution for '{user_content[:50]}...'"
        elif "creative" in user_content.lower() or "story" in user_content.lower():
            return f"Mock creative response: Once upon a time, regarding '{user_content[:30]}...'"
        elif "data" in user_content.lower() or "analyze" in user_content.lower():
            return f"Mock data analysis: Based on your request about '{user_content[:40]}...', here are the insights."
        elif "research" in user_content.lower() or "search" in user_content.lower():
            return f"Mock research response: I found information about '{user_content[:40]}...' from various sources."
        else:
            return f"Mock assistant response: I understand you're asking about '{user_content[:50]}...'. Here's my helpful response."

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Generate a mock response synchronously."""
        response_text = self._generate_mock_response(messages)

        ai_message = AIMessage(content=response_text)
        generation = ChatGeneration(message=ai_message)

        return ChatResult(generations=[generation])

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Generate a mock response asynchronously."""
        # Simulate async delay
        await asyncio.sleep(0.1)
        return self._generate(messages, stop, run_manager, **kwargs)

    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGeneration]:
        """Stream a mock response synchronously."""
        response_text = self._generate_mock_response(messages)

        # Split response into chunks for streaming simulation
        words = response_text.split()
        for i, word in enumerate(words):
            chunk_text = word + (" " if i < len(words) - 1 else "")
            ai_message = AIMessage(content=chunk_text)
            yield ChatGeneration(message=ai_message)

    async def _astream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> AsyncIterator[ChatGeneration]:
        """Stream a mock response asynchronously."""
        response_text = self._generate_mock_response(messages)

        # Split response into chunks for streaming simulation
        words = response_text.split()
        for i, word in enumerate(words):
            # Simulate streaming delay
            await asyncio.sleep(0.05)

            chunk_text = word + (" " if i < len(words) - 1 else "")
            ai_message = AIMessage(content=chunk_text)
            yield ChatGeneration(message=ai_message)


def is_test_mode() -> bool:
    """Check if we're running in test mode."""
    return os.getenv("TEST_MODE", "").lower() in ("true", "1", "yes") or os.getenv(
        "OPENAI_API_KEY", ""
    ).startswith("test-")


def create_mock_openai(**kwargs) -> MockChatOpenAI:
    """Create a mock OpenAI chat model with the same interface as ChatOpenAI."""
    return MockChatOpenAI(**kwargs)
