"""General chatbot chain implementation."""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from ..llm import get_llm
from ..memory import memory_store


def create_chatbot_chain():
    """Create a general-purpose chatbot.

    Returns:
        Configured chatbot chain
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a helpful and friendly AI assistant. You can help with a wide variety of tasks including:
    - Answering questions
    - Providing explanations
    - Creative writing
    - Problem solving
    - General conversation

    Be conversational, helpful, and engaging. If you're unsure about something, say so.
    """,
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = get_llm("openai")
    chain = prompt | llm | StrOutputParser()

    return chain


def create_chatbot_chain_with_history():
    """Create a general-purpose chatbot with conversation history.

    Returns:
        Configured chatbot chain with message history persistence
    """
    base_chain = create_chatbot_chain()
    return memory_store.create_with_history(base_chain)
