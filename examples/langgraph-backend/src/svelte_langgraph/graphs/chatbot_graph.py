"""General chatbot graph implementation using LangGraph."""

from typing import Any, Dict, List, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, StateGraph
from langgraph.graph.graph import CompiledGraph

from ..llm import get_llm


class ChatbotState(TypedDict):
    """State for the chatbot graph."""

    messages: List[BaseMessage]
    response: str


def chatbot_node(state: ChatbotState) -> Dict[str, Any]:
    """Main chatbot processing node."""

    # Create the prompt template
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

    # Get LLM and create chain
    llm = get_llm("openai")
    chain = prompt | llm

    # Invoke the chain with the current messages
    result = chain.invoke({"messages": state["messages"]})

    # Extract content from the result
    if hasattr(result, "content"):
        response_content = result.content
    else:
        response_content = str(result)

    # Add the AI response to messages
    updated_messages = state["messages"] + [AIMessage(content=response_content)]

    return {"messages": updated_messages, "response": response_content}


def create_chatbot_graph() -> CompiledGraph:
    """Create a chatbot graph using LangGraph.

    Returns:
        Compiled LangGraph for the chatbot
    """
    # Create the state graph
    workflow = StateGraph(ChatbotState)

    # Add the chatbot node
    workflow.add_node("chatbot", chatbot_node)

    # Set entry point
    workflow.set_entry_point("chatbot")

    # Add edge to END
    workflow.add_edge("chatbot", END)

    # Compile the graph
    return workflow.compile()


def create_chatbot_graph_with_checkpointing() -> CompiledGraph:
    """Create a chatbot graph with checkpointing for persistence.

    Returns:
        Compiled LangGraph with checkpointing enabled
    """
    from ..database import create_checkpointer_context

    # Create the state graph
    workflow = StateGraph(ChatbotState)

    # Add the chatbot node
    workflow.add_node("chatbot", chatbot_node)

    # Set the entrypoint
    workflow.set_entry_point("chatbot")

    # Set finish point
    workflow.add_edge("chatbot", END)

    # Compile the graph with checkpointing
    with create_checkpointer_context() as checkpointer:
        return workflow.compile(checkpointer=checkpointer)
