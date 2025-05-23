"""Research assistant chain implementation with search capabilities."""

from typing import Dict, Any

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langchain_community.tools import DuckDuckGoSearchRun

from ..llm import get_llm


def create_research_assistant_chain():
    """Create a research assistant with search capabilities.
    
    Returns:
        Configured research assistant chain with search functionality
    """
    search_tool = DuckDuckGoSearchRun()

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a meticulous research assistant. You specialize in:
    - Academic and professional research
    - Fact-checking and verification
    - Literature reviews
    - Comparative analysis
    - Source evaluation
    - Research methodology

    When conducting research:
    1. Use multiple reliable sources
    2. Cross-reference information
    3. Cite your sources
    4. Present balanced perspectives
    5. Identify potential biases
    6. Suggest areas for further investigation
    """,
        ),
        MessagesPlaceholder(variable_name="messages"),
    ])

    def research_chain(inputs: Dict[str, Any]) -> str:
        messages = inputs.get("messages", [])
        if not messages:
            return "Please provide a research query."

        # Get the latest message
        query = messages[-1].content

        # Perform search
        try:
            search_results = search_tool.run(query)

            # Create context with search results
            context_prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    """You are a research assistant. Use the search results below to provide a comprehensive answer.

            Search Results:
            {search_results}

            Instructions:
            - Synthesize information from the search results
            - Provide a well-structured response
            - Cite key points from the results
            - If information is limited, acknowledge this
            """,
                ),
                MessagesPlaceholder(variable_name="messages"),
            ])

            llm = get_llm("openai")

            response = (context_prompt | llm | StrOutputParser()).invoke(
                {"search_results": search_results, "messages": messages}
            )

            return response

        except Exception as e:
            return f"I encountered an error while searching: {str(e)}. I can still help based on my existing knowledge."

    return RunnableLambda(research_chain)