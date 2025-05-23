"""Creative writing assistant chain implementation."""

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser

from ..llm import get_llm


def create_creative_writer_chain():
    """Create a creative writing assistant.

    Returns:
        Configured creative writing chain
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a talented creative writer and storyteller. You excel at:
    - Creative writing in various genres (fiction, poetry, scripts, etc.)
    - Character development and world-building
    - Plot structure and narrative techniques
    - Writing style adaptation
    - Editing and improving existing content
    - Brainstorming creative ideas

    When helping with creative writing:
    1. Be imaginative and inspiring
    2. Provide specific, actionable suggestions
    3. Help develop ideas further
    4. Offer multiple creative options
    5. Consider different genres and styles
    6. Focus on engaging storytelling
    """,
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = get_llm("anthropic", temperature=0.8)  # Higher temperature for creativity
    chain = prompt | llm | StrOutputParser()

    return chain
