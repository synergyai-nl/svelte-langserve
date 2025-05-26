"""LLM configuration and factory functions."""

import logging

from typing import Literal

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from .testing import create_mock_openai, is_test_mode


logger = logging.getLogger(__name__)


def get_llm(
    model_type: Literal["openai", "anthropic"] = "openai", temperature: float = 0.7
):
    """Get configured LLM based on type.

    In test mode (TEST_MODE=true or OPENAI_API_KEY starts with 'test-'),
    returns mock implementations that don't require real API keys.

    Args:
        model_type: The type of model to use ("openai" or "anthropic")
        temperature: The temperature setting for the model

    Returns:
        Configured LLM instance (real or mock depending on environment)

    Raises:
        ValueError: If model_type is not supported
    """
    if model_type == "openai":
        if is_test_mode():
            logger.info("🧪 Using mock OpenAI LLM for testing")
            return create_mock_openai(
                model="gpt-4-mock",
                temperature=temperature,
            )
        else:
            logger.info("🤖 Using real OpenAI LLM")
            return ChatOpenAI(
                model="gpt-4",
                temperature=temperature,
                timeout=60,
            )
    elif model_type == "anthropic":
        if is_test_mode():
            logger.warning(
                "🚧 Mock Anthropic not implemented yet, this may fail in test mode"
            )

        return ChatAnthropic(
            model_name="claude-3-5-sonnet-20241022",
            temperature=temperature,
            max_tokens_to_sample=1024,
            timeout=60,
            stop=[],
        )
    else:
        raise ValueError(f"Unknown model type: {model_type}")
