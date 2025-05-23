"""General chatbot chain implementation."""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from ..llm import get_llm


def create_chatbot_chain():
    """Create a general-purpose chatbot.
    
    Returns:
        Configured chatbot chain
    """
    prompt = ChatPromptTemplate.from_messages([
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
    ])

    llm = get_llm("openai")
    chain = prompt | llm | StrOutputParser()

    return chain