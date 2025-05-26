"""Test echo agent graph implementation using LangGraph."""

from typing import Any, Dict, List, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph import END, StateGraph
from langgraph.graph.graph import CompiledGraph


class EchoAgentState(TypedDict):
    """State for the echo agent graph."""

    messages: List[BaseMessage]
    response: str


def echo_agent_node(state: EchoAgentState) -> Dict[str, Any]:
    """Echo agent processing node that doesn't require API keys."""

    # Find the last human message
    last_human_message = None
    for message in reversed(state["messages"]):
        if isinstance(message, HumanMessage):
            last_human_message = message
            break

    if last_human_message:
        # Echo the message with a predictable format
        response_content = f"Echo: {last_human_message.content}"
    else:
        response_content = "Echo: No message to echo"

    # Add the AI response to messages
    updated_messages = state["messages"] + [AIMessage(content=response_content)]

    return {"messages": updated_messages, "response": response_content}


def create_test_echo_graph() -> CompiledGraph:
    """Create a test echo agent graph using LangGraph.

    This agent echoes back user input without requiring any API keys,
    making it perfect for E2E testing.

    Returns:
        Compiled LangGraph for the echo agent
    """
    # Create the state graph
    workflow = StateGraph(EchoAgentState)

    # Add the echo agent node
    workflow.add_node("echo_agent", echo_agent_node)

    # Set entry point
    workflow.set_entry_point("echo_agent")

    # Add edge to END
    workflow.add_edge("echo_agent", END)

    # Compile the graph
    return workflow.compile()


def create_test_echo_graph_with_checkpointing() -> CompiledGraph:
    """Create a test echo agent graph with checkpointing for persistence.

    Returns:
        Compiled LangGraph with checkpointing enabled
    """
    from ..database import create_checkpointer_context

    # Create the state graph
    workflow = StateGraph(EchoAgentState)

    # Add the echo agent node
    workflow.add_node("echo_agent", echo_agent_node)

    # Set the entrypoint
    workflow.set_entry_point("echo_agent")

    # Set finish point
    workflow.add_edge("echo_agent", END)

    # Compile the graph with checkpointing
    with create_checkpointer_context() as checkpointer:
        return workflow.compile(checkpointer=checkpointer)
