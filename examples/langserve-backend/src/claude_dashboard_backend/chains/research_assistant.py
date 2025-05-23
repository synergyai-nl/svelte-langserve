"""Research assistant chain implementation with search capabilities."""

from typing import Any, Dict

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda

from ..llm import get_llm


def create_research_assistant_chain():
    """Create a research assistant with search capabilities.

    Returns:
        Configured research assistant chain with search functionality
    """
    # Try to import and use DuckDuckGo search
    search_tool = None
    try:
        from langchain_community.tools import DuckDuckGoSearchRun
        search_tool = DuckDuckGoSearchRun()
    except ImportError:
        pass

    def research_chain(inputs: Dict[str, Any]) -> str:
        messages = inputs.get("messages", [])
        if not messages:
            return "Please provide a research query."

        # Get the latest message
        query = messages[-1].content

        # If search tool is available, use it
        if search_tool:
            try:
                search_results = search_tool.run(query)

                # Create context with search results
                context_prompt = ChatPromptTemplate.from_messages(
                    [
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
                    ]
                )

                llm = get_llm("openai")

                response = (context_prompt | llm | StrOutputParser()).invoke(
                    {"search_results": search_results, "messages": messages}
                )

                return response

            except Exception as e:
                # Fall through to knowledge-only response
                pass

        # Use knowledge-only approach
        knowledge_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are a research assistant with extensive knowledge. Since search tools are not available, 
                I'll provide research guidance based on my training data and knowledge.
                
                I can help with:
                - Explaining concepts and topics
                - Providing background information
                - Suggesting research methodologies
                - Recommending sources to investigate
                - Analyzing trends based on historical data
                
                Note: My information has a knowledge cutoff, so for current events or very recent data, 
                I recommend verifying with current sources."""
            ),
            ("user", "{query}")
        ])
        
        llm = get_llm("openai")
        response = (knowledge_prompt | llm | StrOutputParser()).invoke({"query": query})
        return response

    return RunnableLambda(research_chain)
