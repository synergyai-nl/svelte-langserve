"""Code assistant graph implementation using LangGraph."""

from typing import TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph import StateGraph, END
from langgraph.graph import Graph

from ..llm import get_llm


class CodeAssistantState(TypedDict):
    """State for the code assistant graph."""
    messages: List[BaseMessage]
    response: str


def code_assistant_node(state: CodeAssistantState) -> Dict[str, Any]:
    """Main code assistant processing node."""
    
    # Create the prompt template
    prompt = ChatPromptTemplate.from_messages([
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
"""
        ),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    # Get LLM with lower temperature for more consistent code
    llm = get_llm("openai", temperature=0.1)
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


def create_code_assistant_graph() -> Graph:
    """Create a code assistant graph using LangGraph.
    
    Returns:
        Compiled LangGraph for the code assistant
    """
    # Create the state graph
    workflow = StateGraph(CodeAssistantState)
    
    # Add the code assistant node
    workflow.add_node("code_assistant", code_assistant_node)
    
    # Set entry point
    workflow.set_entry_point("code_assistant")
    
    # Add edge to END
    workflow.add_edge("code_assistant", END)
    
    # Compile the graph
    return workflow.compile()


def create_code_assistant_graph_with_checkpointing() -> Graph:
    """Create a code assistant graph with checkpointing for persistence.
    
    Returns:
        Compiled LangGraph with checkpointing enabled
    """
    from langgraph.checkpoint.postgres import PostgresCheckpointer
    import os
    
    # Create checkpointer for persistence
    db_url = os.getenv("LANGGRAPH_DB_URL", "postgresql://langgraph:langgraph@localhost:5432/langgraph")
    checkpointer = PostgresCheckpointer.from_conn_string(db_url)
    
    # Create the graph with checkpointing
    graph = create_code_assistant_graph()
    return graph.with_checkpointer(checkpointer)