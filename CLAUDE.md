# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend Development (SvelteKit)

```bash
# Install dependencies
cd examples/dashboard
pnpm install

# Start frontend in development mode
cd examples/dashboard
pnpm dev

# Build frontend for production
cd examples/dashboard
pnpm build

# Preview production build
cd examples/dashboard
pnpm preview

# Run unit tests
cd examples/dashboard
pnpm test:unit

# Run end-to-end tests
cd examples/dashboard
pnpm test:e2e

# Run all tests
cd examples/dashboard
pnpm test

# Check types
cd examples/dashboard
pnpm check

# Lint and format code
cd examples/dashboard
pnpm lint
pnpm format
```

### Backend Development (Python/FastAPI/LangServe)

```bash
# Install backend dependencies and run (using uv - recommended)
cd examples/langserve-backend
uv run serve

# Or run directly
cd examples/langserve-backend
uv run main.py

# Alternative: Manual setup
cd examples/langserve-backend
pip install -e .
python main.py

# Development mode with auto-reload
cd examples/langserve-backend
uv run uvicorn src.claude_dashboard_backend.main:create_app --factory --reload --port 8000
```

### Docker Deployment

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Architecture Overview

This project is a SvelteKit-based dashboard for interacting with LangServe endpoints via Socket.IO, providing a responsive and real-time chat interface for AI assistants.

### High-Level Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/Streaming    ┌─────────────────┐
│   Browser/Web   │ ◄─────────────► │   SvelteKit     │ ◄──────────────────► │   LangServe     │
│     Client      │                 │    Frontend     │                      │    Backends     │
└─────────────────┘                 └─────────────────┘                      └─────────────────┘
                                            │                                         │
                                            ▼                                         ▼
                                    ┌─────────────────┐                      ┌─────────────────┐
                                    │    Socket.IO    │                      │   ChatGPT-4     │
                                    │     Server      │                      │   Claude-3      │
                                    └─────────────────┘                      │   Custom LLMs   │
                                                                             └─────────────────┘
```

### Key Components

1. **Frontend (SvelteKit)**
   - Real-time UI using Socket.IO for WebSocket communication
   - Components for chat interface, endpoint selection, and configuration
   - Reactive state management using Svelte 5 runes
   - Internationalization with Inlang/Paraglide

2. **Socket.IO Integration**
   - Implemented in `hooks.server.ts` for server-side Socket.IO setup
   - Handles real-time messaging between clients and AI agents
   - Manages conversation state, streaming responses, and agent coordination

3. **LangServe Backend**
   - Implements multiple AI agents via LangChain and LangServe
   - Supports streaming responses for real-time interaction
   - Provides a REST API for client communication
   - Includes endpoints for different specialized AI assistants:
     - General chatbot
     - Code assistant
     - Data analyst
     - Creative writer
     - Research assistant

4. **Core Data Flow**
   - Client connects to SvelteKit frontend via Socket.IO
   - Frontend communicates with LangServe backends
   - AI responses stream back to clients in real-time
   - Multiple agents can participate in a single conversation

## Key Implementation Details

### Socket.IO Server (hooks.server.ts)

The Socket.IO server is integrated into SvelteKit's server hooks. It manages:
- Client connections and authentication
- Conversation creation and management
- Message routing between clients and LangServe endpoints
- Streaming response handling
- Agent coordination in multi-agent conversations

### LangServe Frontend Components

The frontend is organized into several key components:
- `LangServeFrontend.svelte`: Main entry point component
- `ChatInterface.svelte`: Handles message display and input
- `EndpointSelector.svelte`: UI for selecting LangServe endpoints
- `ConfigPanel.svelte`: Configuration options for AI responses
- `ConversationList.svelte`: List of active conversations

### State Management

State is managed using Svelte 5 runes in `stores/langserve.ts`:
- Handles Socket.IO connection using reactive runes
- Manages conversations and messages with fine-grained reactivity
- Tracks streaming responses with real-time updates
- Monitors endpoint health with reactive state

### Backend Integration

The backend uses FastAPI with LangServe to create endpoints for different AI agents, with features like:
- Multiple AI agent types
- Streaming responses
- Integration with various LLM providers
- Tool use for certain agents (search, data analysis)
