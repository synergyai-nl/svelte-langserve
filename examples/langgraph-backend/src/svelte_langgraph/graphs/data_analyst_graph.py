"""Data analyst graph implementation using LangGraph with search capabilities."""

import os

from typing import Any, Dict, List, TypedDict

from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.messages import AIMessage, BaseMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, StateGraph
from langgraph.graph.graph import CompiledGraph

from ..llm import get_llm


class DataAnalystState(TypedDict):
    """State for the data analyst graph."""

    messages: List[BaseMessage]
    response: str


def should_use_tools(state: DataAnalystState) -> str:
    """Determine if tools should be used based on the last message."""
    last_message = state["messages"][-1]

    # Check if the message mentions data search, current data, market research, etc.
    search_indicators = [
        "current",
        "latest",
        "recent",
        "search",
        "find data",
        "market research",
        "trends",
        "statistics",
        "up-to-date",
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
        return "use_tools"
    else:
        return "analyze_only"


def data_analyst_node(state: DataAnalystState) -> Dict[str, Any]:
    """Main data analyst processing node without tools."""

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert data analyst and researcher. You excel at:
- Data analysis and interpretation
- Statistical analysis
- Creating data visualizations
- Finding and analyzing datasets
- Market research and trend analysis
- Business intelligence

When analyzing data:
1. Be thorough and methodical
2. Use appropriate statistical methods
3. Explain your reasoning clearly
4. Provide actionable insights
5. Suggest data visualization approaches
6. Recommend data sources when appropriate

Note: You can provide analytical guidance based on your knowledge and suggest where to find current data.
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


def data_analyst_with_search_node(state: DataAnalystState) -> Dict[str, Any]:
    """Data analyst processing node with search capabilities."""

    # Check if search tool is available
    if not os.getenv("TAVILY_API_KEY"):
        # Fall back to knowledge-only analysis
        return data_analyst_node(state)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert data analyst with access to search tools. You excel at:
- Data analysis and interpretation
- Statistical analysis
- Market research and trend analysis
- Finding current data and statistics
- Business intelligence

When you need current data or recent information, use the search tool to find relevant information.
Then analyze the data and provide insights based on your findings.

Available tools:
- tavily_search_results_json: Search for current data, statistics, and research
""",
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    # Create tools
    search_tool = TavilySearchResults(
        max_results=3,
        search_depth="advanced",
        api_wrapper_kwargs={"search_depth": "advanced"},
    )

    llm = get_llm("openai")
    llm_with_tools = llm.bind_tools([search_tool])

    # First, let the LLM decide if it needs to use tools
    chain = prompt | llm_with_tools
    result = chain.invoke({"messages": state["messages"]})

    # Check if the LLM wants to use tools
    if (
        isinstance(result, AIMessage)
        and hasattr(result, "tool_calls")
        and result.tool_calls
    ):
        # Execute tool calls
        tool_messages = []
        for tool_call in result.tool_calls:
            if tool_call["name"] == "tavily_search_results_json":
                search_results = search_tool.invoke(tool_call["args"])
                tool_messages.append(
                    ToolMessage(
                        content=str(search_results), tool_call_id=tool_call["id"]
                    )
                )

        # Add tool call message and tool results to messages
        updated_messages = state["messages"] + [result] + tool_messages

        # Generate final response with tool results
        final_prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """Based on the search results, provide a comprehensive data analysis response.
Synthesize the information and provide actionable insights.""",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        final_chain = final_prompt | llm
        final_result = final_chain.invoke({"messages": updated_messages})

        if hasattr(final_result, "content"):
            response_content = final_result.content
        else:
            response_content = str(final_result)

        final_messages = updated_messages + [AIMessage(content=response_content)]

        return {"messages": final_messages, "response": response_content}
    else:
        # No tools needed, use the direct response
        if hasattr(result, "content"):
            response_content = result.content
        else:
            response_content = str(result)

        updated_messages = state["messages"] + [AIMessage(content=response_content)]

        return {"messages": updated_messages, "response": response_content}


def create_data_analyst_graph() -> CompiledGraph:
    """Create a data analyst graph using LangGraph.

    Returns:
        Compiled LangGraph for the data analyst
    """
    workflow = StateGraph(DataAnalystState)

    # Add nodes
    workflow.add_node("analyze_only", data_analyst_node)
    workflow.add_node("use_tools", data_analyst_with_search_node)

    # Set entry point with conditional logic
    workflow.set_conditional_entry_point(
        should_use_tools, {"analyze_only": "analyze_only", "use_tools": "use_tools"}
    )

    # Add edges to END
    workflow.add_edge("analyze_only", END)
    workflow.add_edge("use_tools", END)

    return workflow.compile()


def create_data_analyst_graph_with_checkpointing() -> CompiledGraph:
    """Create a data analyst graph with checkpointing for persistence.

    Returns:
        Compiled LangGraph with checkpointing enabled
    """
    from langgraph.checkpoint.postgres import PostgresSaver

    db_url = os.getenv(
        "LANGGRAPH_DB_URL", "postgresql://langgraph:langgraph@localhost:5432/langgraph"
    )

    workflow = StateGraph(DataAnalystState)

    # Add nodes
    workflow.add_node("analyze_only", data_analyst_node)
    workflow.add_node("use_tools", data_analyst_with_search_node)

    # Set entry point with conditional logic
    workflow.set_conditional_entry_point(
        should_use_tools, {"analyze_only": "analyze_only", "use_tools": "use_tools"}
    )

    # Add edges to END
    workflow.add_edge("analyze_only", END)
    workflow.add_edge("use_tools", END)

    # Compile the graph with checkpointing
    with PostgresSaver.from_conn_string(db_url) as checkpointer:
        return workflow.compile(checkpointer=checkpointer)
