"""LLM configuration and factory functions."""

from typing import Literal

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI


def get_llm(
    model_type: Literal["openai", "anthropic"] = "openai", temperature: float = 0.7
):
    """Get configured LLM based on type.

    Args:
        model_type: The type of model to use ("openai" or "anthropic")
        temperature: The temperature setting for the model

    Returns:
        Configured LLM instance

    Raises:
        ValueError: If model_type is not supported
    """
    if model_type == "openai":
        return ChatOpenAI(
            model="gpt-4",
            temperature=temperature,
        )
    elif model_type == "anthropic":
        return ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            temperature=temperature,
            max_tokens=1024,
        )
    else:
        raise ValueError(f"Unknown model type: {model_type}")
