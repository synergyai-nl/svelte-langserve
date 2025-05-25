"""Research assistant graph implementation using LangGraph with search capabilities."""

import os
from typing import Any, Dict, List, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph import END, StateGraph
from langgraph.graph import Graph

from ..llm import get_llm


class ResearchAssistantState(TypedDict):
    """State for the research assistant graph."""

    messages: List[BaseMessage]
    response: str


def should_search(state: ResearchAssistantState) -> str:
    """Determine if search should be used based on the last message."""
    last_message = state["messages"][-1]

    # Check if the message is asking for current information
    search_indicators = [
        "current",
        "latest",
        "recent",
        "news",
        "today",
        "this year",
        "search",
        "find",
        "look up",
        "what's happening",
        "update",
    ]

    # Handle both string and list content types
    if isinstance(last_message.content, str):
        message_content = last_message.content.lower()
    elif isinstance(last_message.content, list):
        # If content is a list, convert to string and get text content
        message_content = " ".join(
            item if isinstance(item, str) else str(item.get("text", ""))
            for item in last_message.content
            if isinstance(item, (str, dict))
        ).lower()
    else:
        message_content = str(last_message.content).lower()

    if any(indicator in message_content for indicator in search_indicators):
        return "search_and_research"
    else:
        return "knowledge_research"


def knowledge_research_node(state: ResearchAssistantState) -> Dict[str, Any]:
    """Research node using knowledge only."""

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a research assistant with extensive knowledge. You excel at:
- Explaining concepts and topics in detail
- Providing comprehensive background information
- Suggesting research methodologies
- Recommending authoritative sources to investigate
- Analyzing trends based on historical data
- Synthesizing information from multiple perspectives

When providing research assistance:
1. Be thorough and well-structured
2. Provide multiple perspectives when relevant
3. Suggest credible sources for further research
4. Acknowledge limitations of your knowledge cutoff
5. Recommend verification for current events

Note: My information has a knowledge cutoff, so for current events or very recent data,
I recommend verifying with current sources.
""",
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = get_llm("openai")
    chain = prompt | llm

    result = chain.invoke({"messages": state["messages"]})

    if hasattr(result, "content"):
        response_content = result.content
    else:
        response_content = str(result)

    updated_messages = state["messages"] + [AIMessage(content=response_content)]

    return {"messages": updated_messages, "response": response_content}


def search_and_research_node(state: ResearchAssistantState) -> Dict[str, Any]:
    """Research node with search capabilities."""

    # Try to use DuckDuckGo search
    search_results = None
    try:
        from langchain_community.tools import DuckDuckGoSearchRun

        search_tool = DuckDuckGoSearchRun()
        query = state["messages"][-1].content

        # Perform search
        search_results = search_tool.run(query)

    except Exception:
        # If search fails, fall back to knowledge-only
        return knowledge_research_node(state)

    if search_results:
        # Create response with search results
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """You are a research assistant with access to current search results.

Search Results:
{search_results}

Instructions:
- Synthesize information from the search results above
- Provide a comprehensive, well-structured response
- Cite key points from the search results
- Add context and analysis based on your knowledge
- If search results are limited, acknowledge this and supplement with your knowledge
- Suggest additional research directions if relevant
""",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        llm = get_llm("openai")
        chain = prompt | llm

        result = chain.invoke(
            {"search_results": search_results, "messages": state["messages"]}
        )
    else:
        # Fall back to knowledge-only research
        return knowledge_research_node(state)

    if hasattr(result, "content"):
        response_content = result.content
    else:
        response_content = str(result)

    updated_messages = state["messages"] + [AIMessage(content=response_content)]

    return {"messages": updated_messages, "response": response_content}


def create_research_assistant_graph() -> Graph:
    """Create a research assistant graph using LangGraph.

    Returns:
        Compiled LangGraph for the research assistant
    """
    workflow = StateGraph(ResearchAssistantState)

    # Add nodes
    workflow.add_node("knowledge_research", knowledge_research_node)
    workflow.add_node("search_and_research", search_and_research_node)

    # Set conditional entry point
    workflow.set_conditional_entry_point(
        should_search,
        {
            "knowledge_research": "knowledge_research",
            "search_and_research": "search_and_research",
        },
    )

    # Add edges to END
    workflow.add_edge("knowledge_research", END)
    workflow.add_edge("search_and_research", END)

    return workflow.compile()


def create_research_assistant_graph_with_checkpointing() -> Graph:
    """Create a research assistant graph with checkpointing for persistence.

    Returns:
        Compiled LangGraph with checkpointing enabled
    """
    from langgraph.checkpoint.postgres import PostgresCheckpointer

    db_url = os.getenv(
        "LANGGRAPH_DB_URL", "postgresql://langgraph:langgraph@localhost:5432/langgraph"
    )
    checkpointer = PostgresCheckpointer.from_conn_string(db_url)

    graph = create_research_assistant_graph()
    return graph.with_checkpointer(checkpointer)
