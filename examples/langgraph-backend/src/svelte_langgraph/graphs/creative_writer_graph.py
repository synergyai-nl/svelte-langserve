"""Creative writer graph implementation using LangGraph."""

from typing import TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph import StateGraph, END
from langgraph.graph import Graph

from ..llm import get_llm


class CreativeWriterState(TypedDict):
    """State for the creative writer graph."""
    messages: List[BaseMessage]
    response: str


def creative_writer_node(state: CreativeWriterState) -> Dict[str, Any]:
    """Main creative writer processing node."""
    
    # Create the prompt template
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a skilled creative writer and storyteller. You excel at:
- Crafting engaging narratives and stories
- Writing poetry in various styles
- Creating compelling characters and dialogue
- Developing plot structures and story arcs
- Writing in different genres (fantasy, sci-fi, mystery, romance, etc.)
- Adapting tone and style to match requests

When writing creatively:
1. Use vivid, descriptive language
2. Create immersive experiences for readers
3. Develop authentic characters with distinct voices
4. Build tension and emotional resonance
5. Consider pacing and narrative flow
6. Adapt to the requested style, genre, or format
"""
        ),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    # Get LLM with higher temperature for more creative responses
    llm = get_llm("openai", temperature=0.8)
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


def create_creative_writer_graph() -> Graph:
    """Create a creative writer graph using LangGraph.
    
    Returns:
        Compiled LangGraph for the creative writer
    """
    # Create the state graph
    workflow = StateGraph(CreativeWriterState)
    
    # Add the creative writer node
    workflow.add_node("creative_writer", creative_writer_node)
    
    # Set entry point
    workflow.set_entry_point("creative_writer")
    
    # Add edge to END
    workflow.add_edge("creative_writer", END)
    
    # Compile the graph
    return workflow.compile()


def create_creative_writer_graph_with_checkpointing() -> Graph:
    """Create a creative writer graph with checkpointing for persistence.
    
    Returns:
        Compiled LangGraph with checkpointing enabled
    """
    from langgraph.checkpoint.postgres import PostgresCheckpointer
    import os
    
    # Create checkpointer for persistence
    db_url = os.getenv("LANGGRAPH_DB_URL", "postgresql://langgraph:langgraph@localhost:5432/langgraph")
    checkpointer = PostgresCheckpointer.from_conn_string(db_url)
    
    # Create the graph with checkpointing
    graph = create_creative_writer_graph()
    return graph.with_checkpointer(checkpointer)