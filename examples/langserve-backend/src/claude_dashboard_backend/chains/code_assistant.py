"""Code assistant chain implementation."""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from ..llm import get_llm


def create_code_assistant_chain():
    """Create a specialized coding assistant.

    Returns:
        Configured code assistant chain
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert software engineer and coding assistant. You specialize in:
    - Writing clean, efficient code in multiple languages
    - Debugging and troubleshooting
    - Code review and best practices
    - Architecture and design patterns
    - Performance optimization
    - Testing strategies

    When providing code:
    1. Include clear comments
    2. Follow best practices for the language
    3. Provide explanations for complex logic
    4. Suggest alternative approaches when relevant
    5. Consider error handling and edge cases
    """,
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = get_llm(
        "openai", temperature=0.1
    )  # Lower temperature for more consistent code
    chain = prompt | llm | StrOutputParser()

    return chain
