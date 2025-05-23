"""Data analyst chain implementation with search capabilities."""

import os
from typing import Any, Dict

from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda

from ..llm import get_llm


def create_data_analyst_chain():
    """Create a data analysis assistant with search capabilities.

    Returns:
        Configured data analyst chain with search tools
    """
    # Tools for data analysis
    tools = []
    
    # Only add search tool if API key is available
    if os.getenv("TAVILY_API_KEY"):
        search_tool = TavilySearchResults(
            max_results=3,
            search_depth="advanced",
            api_wrapper_kwargs={"search_depth": "advanced"},
        )
        tools.append(search_tool)

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
    6. Use search tools to find relevant data when needed

    You have access to search tools to find current data and research.
    """,
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )

    llm = get_llm("openai")

    # If no tools available, create a simple chain instead of agent
    if not tools:
        from langchain_core.output_parsers import StrOutputParser
        
        def format_for_simple_chain(inputs: Dict[str, Any]) -> Dict[str, Any]:
            messages = inputs.get("messages", [])
            if messages:
                # Convert last message to input
                input_msg = messages[-1].content if messages else ""
                return {"input": input_msg}
            return {"input": ""}
        
        simple_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert data analyst. You excel at:
- Data analysis and interpretation
- Statistical analysis concepts
- Creating data visualization recommendations
- Explaining analytical methods
- Business intelligence insights

Note: Search tools are not available in this configuration, but you can still provide analytical guidance based on your knowledge."""),
            ("user", "{input}")
        ])
        
        chain = RunnableLambda(format_for_simple_chain) | simple_prompt | llm | StrOutputParser()
        return chain

    agent = create_openai_functions_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # Wrapper to handle message format
    def format_for_agent(inputs: Dict[str, Any]) -> Dict[str, Any]:
        messages = inputs.get("messages", [])
        if messages:
            # Convert last message to input, rest to chat_history
            input_msg = messages[-1].content if messages else ""
            chat_history = messages[:-1] if len(messages) > 1 else []

            return {"input": input_msg, "chat_history": chat_history}
        return {"input": "", "chat_history": []}

    chain = RunnableLambda(format_for_agent) | agent_executor | (lambda x: x["output"])

    return chain
