# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo containing:
- **examples/dashboard**: SvelteKit frontend with Socket.IO integration
- **examples/langserve-backend**: Python FastAPI backend with LangServe
- **packages/@svelte-langserve/***: Reusable npm packages for Svelte-LangServe integration

## Essential Commands

### Quick Start (Full Stack)
```bash
# Install all dependencies
pnpm install

# Start backend (in one terminal)
cd examples/langserve-backend && uv run serve

# Start frontend (in another terminal)  
cd examples/dashboard && pnpm dev
```

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

# Or run directly with proper module path
cd examples/langserve-backend
uv run main.py

# Development mode with auto-reload
cd examples/langserve-backend
uv run uvicorn src.svelte_langserve.main:create_app --factory --reload --port 8000

# Development tools
cd examples/langserve-backend
uv run ruff check .        # Lint code
uv run ruff format .       # Format code
uv run pytest             # Run tests
uv run pyright            # Type checking
```

### Package Development (Consolidated Library)

```bash
# Build consolidated package
cd packages/svelte-langserve
pnpm build

# Test consolidated package
cd packages/svelte-langserve
pnpm test

# Lint consolidated package
cd packages/svelte-langserve
pnpm lint

# Run all quality checks
nx run-many -t test,lint,check

# Publish package (when ready)
cd packages/svelte-langserve
npm publish
```

### Docker Deployment

```bash
# Setup environment variables (required)
cp .env.example .env
# Edit .env with your API keys

# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f svelte-frontend
docker-compose logs -f langserve-backend

# Rebuild and restart services
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Nx Development Commands

```bash
# Run tests across all projects with detailed output (recommended for Claude)
nx run-many --target=test --output-style=stream

# Run linting and type checking
nx run-many --target=lint,check --output-style=stream

# Run all quality checks
nx run-many --target=test,lint,check --output-style=stream --parallel=3
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Required environment variables:
# - OPENAI_API_KEY: For OpenAI models
# - ANTHROPIC_API_KEY: For Claude models  
# - TAVILY_API_KEY: For research agent (optional)
```

## Architecture Overview

This project is a **monorepo** containing a SvelteKit-based dashboard for interacting with LangServe endpoints via Socket.IO, providing a responsive and real-time chat interface for AI assistants.

**Architecture Note**: The project has been simplified from 4 separate packages to a single consolidated `svelte-langserve` package for improved maintainability and reduced complexity.

### Monorepo Structure
```
claude-rocks-the-dashboard/
├── examples/                    # Example applications
│   ├── dashboard/              # SvelteKit frontend demo
│   └── langserve-backend/      # FastAPI backend demo
├── packages/svelte-langserve/  # Consolidated npm package
│   ├── stores/                 # Socket.IO & state management
│   ├── components/             # Svelte UI components
│   ├── client/                 # LangServe client adapters
│   └── types.ts                # LangChain-compatible types
└── nx.json                     # Nx monorepo configuration
```

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

1. **Frontend (SvelteKit) - `examples/dashboard/`**
   - Real-time UI using Socket.IO for WebSocket communication
   - Components for chat interface, endpoint selection, and configuration
   - Reactive state management using Svelte 5 runes
   - Internationalization with Inlang/Paraglide
   - **Note:** Currently contains duplicate store logic that should use packages

2. **Socket.IO Integration - `examples/dashboard/src/hooks.server.ts`**
   - Handles real-time messaging between clients and AI agents
   - Manages conversation state, streaming responses, and agent coordination
   - **Architecture Issue:** 657-line monolithic file needs refactoring (see TODO.md)

3. **LangServe Backend - `examples/langserve-backend/`**
   - Implements 5 specialized AI agents via LangChain and LangServe
   - Supports streaming responses for real-time interaction
   - FastAPI with JWT authentication
   - Module path: `src.svelte_langserve.*` (not `src.claude_dashboard_backend.*`)

4. **Reusable Packages - `packages/@svelte-langserve/`**
   - **@svelte-langserve/core**: Connection logic and stores
   - **@svelte-langserve/ui**: Reusable Svelte components
   - **@svelte-langserve/types**: Shared TypeScript definitions
   - **Current Issue:** Underutilized - examples should use packages instead of duplicating code

5. **Core Data Flow**
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
