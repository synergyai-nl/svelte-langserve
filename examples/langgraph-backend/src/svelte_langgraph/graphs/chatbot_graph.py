"""General chatbot graph implementation using LangGraph."""

from typing import TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph import StateGraph, END
from langgraph.graph import Graph

from ..llm import get_llm


class ChatbotState(TypedDict):
    """State for the chatbot graph."""
    messages: List[BaseMessage]
    response: str


def chatbot_node(state: ChatbotState) -> Dict[str, Any]:
    """Main chatbot processing node."""
    
    # Create the prompt template
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
"""
        ),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    # Get LLM and create chain
    llm = get_llm("openai")
    chain = prompt | llm
    
    # Invoke the chain with the current messages
    result = chain.invoke({"messages": state["messages"]})
    
    # Extract content from the result
    if hasattr(result, 'content'):
        response_content = result.content
    else:
        response_content = str(result)
    
    # Add the AI response to messages
    updated_messages = state["messages"] + [AIMessage(content=response_content)]
    
    return {
        "messages": updated_messages,
        "response": response_content
    }


def create_chatbot_graph() -> Graph:
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


def create_chatbot_graph_with_checkpointing() -> Graph:
    """Create a chatbot graph with checkpointing for persistence.
    
    Returns:
        Compiled LangGraph with checkpointing enabled
    """
    from langgraph.checkpoint.postgres import PostgresCheckpointer
    import os
    
    # Create checkpointer for persistence
    db_url = os.getenv("LANGGRAPH_DB_URL", "postgresql://langgraph:langgraph@localhost:5432/langgraph")
    checkpointer = PostgresCheckpointer.from_conn_string(db_url)
    
    # Create the graph with checkpointing
    graph = create_chatbot_graph()
    return graph.with_checkpointer(checkpointer)