# Claude Dashboard Backend

A uv-based Python project providing LangServe endpoints for multiple AI agents accessible via Socket.IO frontend.

## Project Structure

This project follows the Pythonic `src/` layout convention with uv project management:

```
backend/
├── pyproject.toml          # Project configuration and dependencies
├── .python-version         # Python version specification
├── main.py                 # Entry point script
├── src/
│   └── claude_dashboard_backend/
│       ├── __init__.py     # Package initialization
│       ├── main.py         # Application entry point
│       ├── app.py          # FastAPI application setup
│       ├── config.py       # Configuration settings
│       ├── llm.py          # LLM factory functions
│       └── chains/         # AI agent chain implementations
│           ├── __init__.py
│           ├── chatbot.py
│           ├── code_assistant.py
│           ├── data_analyst.py
│           ├── creative_writer.py
│           └── research_assistant.py
└── legacy_backend.py       # Original monolithic implementation
```

## Quick Start

### Using uv (Recommended)

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Navigate to backend directory
cd backend

# Install dependencies and run
uv run main.py

# Or use the project script
uv run serve
```

### Manual Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Run the server
python main.py
```

## Environment Variables

Create a `.env` file in the backend directory with:

```bash
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
TAVILY_API_KEY=your-tavily-key  # Optional, for advanced search
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
```

## Available Endpoints

Once running, the following endpoints are available:

- **General Chatbot**: `/chatbot` - General-purpose conversational AI
- **Code Assistant**: `/code-assistant` - Specialized coding and development
- **Data Analyst**: `/data-analyst` - Data analysis with search tools
- **Creative Writer**: `/creative-writer` - Creative writing and storytelling
- **Research Assistant**: `/research-assistant` - Research with web search

### API Documentation

- Interactive docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- Playgrounds: `http://localhost:8000/{endpoint}/playground`

## Development

### Code Quality

```bash
# Format code
uv run ruff format

# Lint code
uv run ruff check

# Type checking (if using mypy)
uv run mypy src/
```

### Testing

```bash
# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=src/claude_dashboard_backend
```

## Architecture

The backend is organized into several key modules:

1. **config.py**: Centralized configuration management
2. **llm.py**: LLM factory functions for different providers
3. **app.py**: FastAPI application setup and middleware
4. **chains/**: Individual AI agent implementations
5. **main.py**: Application entry point and server runner

Each AI agent chain is implemented as a separate module for better maintainability and testing.