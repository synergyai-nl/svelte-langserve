# LangServe Backend Example - Python
# This shows how to create the LangServe backends that the Socket.IO frontend connects to

from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_anthropic import ChatAnthropic
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda
from langchain_openai import ChatOpenAI
from langserve import add_routes

# Initialize FastAPI app
app = FastAPI(
    title="LangServe Backend for Socket.IO Frontend",
    version="1.0",
    description="Multiple AI agents accessible via LangServe",
)


# Configure LLMs
def get_llm(model_type: str = "openai", temperature: float = 0.7):
    """Get configured LLM based on type"""
    if model_type == "openai":
        return ChatOpenAI(
            model="gpt-4",
            temperature=temperature,
        )
    elif model_type == "anthropic":
        return ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            temperature=temperature,
            max_tokens=1024,
        )
    else:
        raise ValueError(f"Unknown model type: {model_type}")


# 1. General Chatbot Chain
def create_chatbot_chain():
    """Create a general-purpose chatbot"""
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

    llm = get_llm("openai")

    chain = prompt | llm | StrOutputParser()

    return chain


# 2. Code Assistant Chain
def create_code_assistant_chain():
    """Create a specialized coding assistant"""
    prompt = ChatPromptTemplate.from_messages(
        [
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
        """,
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = get_llm(
        "openai", temperature=0.1
    )  # Lower temperature for more consistent code

    chain = prompt | llm | StrOutputParser()

    return chain


# 3. Data Analyst Chain with Tools
def create_data_analyst_chain():
    """Create a data analysis assistant with search capabilities"""

    # Tools for data analysis
    search_tool = TavilySearchResults(
        max_results=3,
        search_depth="advanced",
        api_wrapper_kwargs={"search_depth": "advanced"},
    )

    tools = [search_tool]

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


# 4. Creative Writing Assistant
def create_creative_writer_chain():
    """Create a creative writing assistant"""
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a talented creative writer and storyteller. You excel at:
        - Creative writing in various genres (fiction, poetry, scripts, etc.)
        - Character development and world-building
        - Plot structure and narrative techniques
        - Writing style adaptation
        - Editing and improving existing content
        - Brainstorming creative ideas

        When helping with creative writing:
        1. Be imaginative and inspiring
        2. Provide specific, actionable suggestions
        3. Help develop ideas further
        4. Offer multiple creative options
        5. Consider different genres and styles
        6. Focus on engaging storytelling
        """,
            ),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    llm = get_llm("anthropic", temperature=0.8)  # Higher temperature for creativity

    chain = prompt | llm | StrOutputParser()

    return chain


# 5. Research Assistant Chain
def create_research_assistant_chain():
    """Create a research assistant with search capabilities"""

    search_tool = DuckDuckGoSearchRun()

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
            return f"I encountered an error while searching: {str(e)}. I can still help based on my existing knowledge."

    return RunnableLambda(research_chain)


# Add all chains to the FastAPI app
def setup_routes():
    """Add all LangServe routes to the FastAPI app"""

    # General Chatbot
    add_routes(
        app,
        create_chatbot_chain(),
        path="/chatbot",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )

    # Code Assistant
    add_routes(
        app,
        create_code_assistant_chain(),
        path="/code-assistant",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )

    # Data Analyst
    add_routes(
        app,
        create_data_analyst_chain(),
        path="/data-analyst",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )

    # Creative Writer
    add_routes(
        app,
        create_creative_writer_chain(),
        path="/creative-writer",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )

    # Research Assistant
    add_routes(
        app,
        create_research_assistant_chain(),
        path="/research-assistant",
        enable_feedback_endpoint=True,
        enable_public_trace_link_endpoint=True,
        playground_type="chat",
    )


# Setup routes
setup_routes()


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "endpoints": [
            "/chatbot",
            "/code-assistant",
            "/data-analyst",
            "/creative-writer",
            "/research-assistant",
        ],
        "version": "1.0",
    }


# Root endpoint with documentation
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "LangServe Backend for Socket.IO Frontend",
        "documentation": "/docs",
        "health": "/health",
        "available_agents": {
            "chatbot": {
                "path": "/chatbot",
                "description": "General-purpose conversational AI",
                "playground": "/chatbot/playground",
            },
            "code-assistant": {
                "path": "/code-assistant",
                "description": "Specialized coding and development assistant",
                "playground": "/code-assistant/playground",
            },
            "data-analyst": {
                "path": "/data-analyst",
                "description": "Data analysis and research with search tools",
                "playground": "/data-analyst/playground",
            },
            "creative-writer": {
                "path": "/creative-writer",
                "description": "Creative writing and storytelling assistant",
                "playground": "/creative-writer/playground",
            },
            "research-assistant": {
                "path": "/research-assistant",
                "description": "Research assistant with web search capabilities",
                "playground": "/research-assistant/playground",
            },
        },
    }


# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

# Example usage and deployment instructions:
"""
To run this LangServe backend:

1. Install dependencies:
   pip install fastapi langserve langchain-openai langchain-anthropic langchain-community uvicorn

2. Set environment variables:
   export OPENAI_API_KEY="your-openai-key"
   export ANTHROPIC_API_KEY="your-anthropic-key"
   export TAVILY_API_KEY="your-tavily-key"  # Optional, for advanced search

3. Run the server:
   python langserve_backend.py

4. Configure the Socket.IO frontend to connect to:
   - http://localhost:8000/chatbot
   - http://localhost:8000/code-assistant
   - http://localhost:8000/data-analyst
   - http://localhost:8000/creative-writer
   - http://localhost:8000/research-assistant

5. Test endpoints:
   - Visit http://localhost:8000/docs for interactive API documentation
   - Visit http://localhost:8000/chatbot/playground for the chat playground
   - Health check: http://localhost:8000/health

Production deployment considerations:
- Use environment-specific configurations
- Add authentication and rate limiting
- Configure CORS properly
- Use a production ASGI server like Gunicorn
- Add monitoring and logging
- Scale with multiple instances behind a load balancer
"""
