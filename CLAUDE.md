# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a monorepo containing a complete AI chat application framework with **worldclass documentation**:

- **examples/dashboard**: SvelteKit frontend with Flowbite UI integration and Socket.IO  
- **examples/langgraph-backend**: Python FastAPI backend with LangGraph and 5 AI agents
- **packages/svelte-langgraph**: Consolidated npm package with components, stores, and themes
- **docs/**: Comprehensive documentation covering everything from quickstart to production deployment

## Key Project Features

### 🎨 **Flowbite Theme Integration (Major Feature)**
- Complete Flowbite design system integration with dark/light mode
- Professional UI components with accessibility built-in
- Customizable theme system supporting runtime overrides
- Mobile-first responsive design across all devices
- 50+ pre-built components ready for enterprise use

### 🏗️ **Architecture Highlights**
- Real-time WebSocket communication via Socket.IO
- Streaming AI responses with token-by-token rendering
- Multi-agent AI system (5 specialized agents)
- JWT authentication with role-based access control
- Production-ready Docker deployment with monitoring

## Essential Commands

### Quick Start (Full Stack)
```bash
# Install all dependencies (monorepo)
pnpm install

# Start backend (in one terminal)
cd examples/langgraph-backend && uv run serve

# Start frontend (in another terminal)  
cd examples/dashboard && pnpm dev

# Visit http://localhost:5173 or http://localhost:5173/flowbite
```

### Docker Deployment (Recommended for Production)
```bash
# Setup environment variables (required)
cp .env.example .env
# Edit .env with your API keys:
# OPENAI_API_KEY=your-key-here
# ANTHROPIC_API_KEY=your-key-here

# Start all services with Docker Compose
docker-compose up -d

# View at http://localhost:3000
# Login: demo / secret
```

### Development Commands (Nx-powered Monorepo)

```bash
# Quality checks (MUST run before commits)
pnpm quality                    # Comprehensive: lint + typecheck + test across all projects

# Development
pnpm dev                        # Start all services in development mode
pnpm build                      # Build all projects  

# Formatting
pnpm format                     # Format all code (prettier + ruff)
pnpm format:check              # Check formatting without making changes

# Individual targets (if needed)
pnpm lint                       # Lint all projects (eslint + ruff)
pnpm test                       # Run all tests (vitest + pytest)
pnpm typecheck                  # Type checking (svelte-check + pyright)

# Project-specific commands
nx run dashboard:dev            # Frontend only
nx run langgraph-backend:serve  # Backend only
nx run svelte-langgraph:build   # Package only
```

### Pre-commit Workflow

```bash
# REQUIRED before pushing (comprehensive quality check)
pnpm quality

# This runs automatically on commit (fast pre-commit hooks via husky + lint-staged):
# ✅ Formatting (prettier + ruff format) 
# ✅ Linting (eslint + ruff check)
# 
# This runs manually before push (comprehensive quality check):
# ✅ All of the above PLUS
# ✅ Type checking (svelte-check + pyright)  
# ✅ Unit tests (vitest + pytest)
# ✅ Build verification with dependency management
```

### Documentation Development

```bash
# Documentation is in docs/ directory with the following structure:
# docs/
# ├── getting-started/     # Quick start and tutorial
# ├── guides/             # Theme system, auth, deployment
# ├── reference/          # API docs and component reference  
# ├── advanced/           # Architecture and troubleshooting
# └── README.md           # Main documentation entry point

# To update documentation:
# 1. Edit markdown files in docs/
# 2. Update links and cross-references
# 3. Test examples in documentation
# 4. Commit changes
```

### Docker Deployment

```bash
# Development environment
docker-compose up -d

# Production environment (with SSL, monitoring)
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f svelte-frontend
docker-compose logs -f langgraph-backend

# Rebuild and restart services
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Health checks
curl http://localhost:3000/health        # Frontend
curl http://localhost:8000/health        # Backend
```

### Advanced Nx Commands

```bash
# Run specific targets across projects
nx run-many -t lint,check,test --output-style=stream --parallel=3

# Target specific projects
nx run dashboard:quality        # Frontend quality checks only
nx run langgraph-backend:quality  # Backend quality checks only
nx run svelte-langgraph:quality   # Package quality checks only

# Cache management
nx reset                        # Clear nx cache
nx show projects               # List all projects
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Required environment variables:
OPENAI_API_KEY=sk-your-openai-key-here           # Required for AI agents
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key     # Required for Claude agents
TAVILY_API_KEY=your-tavily-key-here              # Optional, for research agent
LANGSMITH_API_KEY=lsv2_pt_your-langsmith-key    # Required for LangGraph

# Database configuration (LangGraph requirements)
LANGGRAPH_DB_URL=postgresql://langgraph:langgraph@localhost:5432/langgraph
REDIS_URL=redis://localhost:6379

# Authentication (change in production!)
SECRET_KEY=your-super-secure-jwt-secret-key-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Server configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info

# Frontend configuration  
PUBLIC_LANGGRAPH_SERVER_URL=http://localhost:8000
PUBLIC_SOCKET_IO_URL=http://localhost:3000
```

## System Requirements

**Node.js Version Support:**
- **Minimum**: Node.js 22 (Current LTS)
- **Recommended**: Node.js 22.x or later
- **Package Manager**: pnpm 9.x or later

**Python Version Support:**
- **Minimum**: Python 3.12+
- **Recommended**: Python 3.12.x or later

**Note**: This project requires Node.js 22+ and Python 3.12+ for optimal performance and latest language features. Earlier versions are not supported.

## Architecture Overview

This project is a **production-ready monorepo** containing a complete AI chat application framework with beautiful Flowbite UI components and comprehensive documentation.

**Major Recent Additions:**
- **Flowbite Theme System**: Complete integration with dark/light mode and customizable themes
- **Worldclass Documentation**: Comprehensive guides from quickstart to production deployment
- **Enterprise Features**: JWT auth, role-based access, rate limiting, monitoring

### Updated Monorepo Structure
```
svelte-langgraph/
├── docs/                           # 📚 Worldclass documentation
│   ├── getting-started/           #    Quick start + tutorial
│   ├── guides/                    #    Themes, auth, deployment  
│   ├── reference/                 #    API docs + components
│   └── advanced/                  #    Architecture + troubleshooting
├── examples/                      # 🚀 Example applications
│   ├── dashboard/                 #    SvelteKit frontend with Flowbite
│   └── langgraph-backend/         #    FastAPI backend with 5 AI agents
├── packages/                      # 📦 Reusable packages
│   └── svelte-langgraph/          #    Consolidated library
│       ├── components/            #      Flowbite UI components
│       ├── stores/                #      Socket.IO & state management
│       ├── themes/                #      Flowbite theme system
│       ├── client/                #      LangGraph client adapters
│       └── types.ts               #      LangChain-compatible types
├── nginx/                         # 🌐 Production nginx config
├── docker-compose.yml             # 🐳 Development deployment
├── docker-compose.prod.yml        # 🚀 Production deployment
└── nx.json                        # ⚡ Nx monorepo configuration
```

### High-Level Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/Streaming    ┌─────────────────┐
│   Browser       │ ◄─────────────► │   SvelteKit     │ ◄──────────────────► │   FastAPI       │
│   (Flowbite UI) │                 │   Frontend      │                      │   LangGraph     │
└─────────────────┘                 └─────────────────┘                      └─────────────────┘
                                            │                                         │
                                            ▼                                         ▼
                                    ┌─────────────────┐                      ┌─────────────────┐
                                    │    Socket.IO    │                      │   5 AI Agents   │
                                    │     Server      │                      │   OpenAI/Claude │
                                    └─────────────────┘                      └─────────────────┘
```

### Key Components

1. **Frontend (SvelteKit + Flowbite) - `examples/dashboard/`**
   - **Flowbite UI Integration**: Professional design system with dark/light modes
   - Real-time UI using Socket.IO for WebSocket communication
   - Components for chat interface, endpoint selection, and configuration
   - Reactive state management using Svelte 5 runes  
   - Internationalization with Inlang/Paraglide
   - **Theme System**: Comprehensive Flowbite theme integration with customization

2. **Socket.IO Integration - `examples/dashboard/src/hooks.server.ts`**
   - Handles real-time messaging between clients and AI agents
   - Manages conversation state, streaming responses, and agent coordination
   - **Architecture Consideration**: Large file (~700 lines) - consider refactoring into services
   - JWT authentication middleware for WebSocket connections

3. **LangGraph Backend - `examples/langgraph-backend/`**
   - Implements 5 specialized AI agents via LangChain and LangGraph:
     - General Chatbot
     - Code Assistant  
     - Data Analyst
     - Creative Writer
     - Research Assistant (with web search)
   - Supports streaming responses for real-time interaction
   - FastAPI with JWT authentication and role-based access control
   - Module path: `src.svelte_langgraph.*`

4. **Consolidated Package - `packages/svelte-langgraph/`**
   - **Complete Svelte integration** for LangGraph with Socket.IO
   - **Flowbite theme system** with runtime customization
   - **UI components** with accessibility and responsive design  
   - **Reactive stores** for real-time state management
   - **TypeScript definitions** compatible with LangChain
   - **Theme architecture** supporting multiple design systems

5. **Comprehensive Documentation - `docs/`**
   - **Getting Started**: Quick start (5 min) + complete tutorial (30 min)
   - **Guides**: Flowbite themes, authentication, production deployment
   - **Reference**: Complete API docs, component library, Socket.IO events
   - **Advanced**: Architecture deep dive, troubleshooting guide

## Key Implementation Details

### Flowbite Theme System

The theme system is a major architectural component:

```typescript
// Theme usage examples
import { ThemeProvider, flowbiteTheme, defaultTheme } from 'svelte-langgraph';

// Automatic Flowbite integration
<LangGraphFrontend userId="user123" theme="flowbite" />

// Custom theme variants
<ThemeProvider theme={flowbiteTheme} variant="dark">
  <ChatInterface />
</ThemeProvider>

// Runtime customization
<ThemeProvider theme={customTheme} override={brandOverrides}>
  <LangGraphFrontend userId="user123" />
</ThemeProvider>
```

**Theme Architecture:**
- **Base themes**: Default Tailwind and Flowbite themes
- **Variants**: Dark, light, compact, mobile optimizations
- **Runtime overrides**: Brand colors, custom styling
- **Component integration**: All components automatically inherit theme
- **Accessibility**: WCAG compliance built into all themes

### Socket.IO Server (hooks.server.ts)

The Socket.IO server integration is comprehensive:
- **Client connections** with JWT authentication middleware
- **Conversation management** with real-time updates
- **Message routing** between clients and LangGraph endpoints
- **Streaming response handling** with chunk-by-chunk delivery
- **Agent coordination** for multi-agent conversations
- **Error handling** with proper client notification
- **Memory management** for streaming messages and conversations

### LangGraph Frontend Components

Component architecture with Flowbite integration:

**Core Components:**
- `LangGraphFrontend.svelte`: Main entry point with theme provider
- `ChatInterface.svelte`: Message display with streaming support
- `ChatMessage.svelte`: Individual messages with role-based styling
- `EndpointSelector.svelte`: Multi-select for AI agents
- `ConfigPanel.svelte`: AI configuration (temperature, tokens, etc.)
- `ConversationList.svelte`: Sidebar with conversation management
- `ThemeProvider.svelte`: Theme context and customization

**Flowbite Components Used:**
- Button, Card, Input, Label, Alert, Dropdown, Modal
- Dark mode toggle, responsive navigation
- Form validation and feedback
- Loading states and skeleton screens

### State Management

Advanced reactive patterns using Svelte 5 runes:

```typescript
// Main store architecture
interface LangGraphState {
  // Connection state
  socket: Socket | null;
  connected: boolean;
  authenticated: boolean;
  
  // Data state  
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Streaming state (memory managed)
  streamingMessages: Map<string, string>;
  
  // UI state
  endpointHealth: Map<string, boolean>;
  messagePagination: Map<string, PaginationState>;
}
```

**Key Patterns:**
- **Reactive stores** with automatic cleanup
- **Memory management** for streaming messages
- **Optimistic updates** for better UX
- **Error boundaries** with graceful degradation
- **Pagination** for large conversation histories

### Backend Integration

FastAPI backend with comprehensive features:

**AI Agent Architecture:**
```python
# Agent implementations in src/svelte_langgraph/chains/
- chatbot.py: General conversation agent
- code_assistant.py: Programming help with tools  
- data_analyst.py: Data analysis with search
- creative_writer.py: Creative content generation
- research_assistant.py: Web search and research
```

**Key Features:**
- **Streaming responses** via LangGraph
- **Tool integration** for specialized agents
- **JWT authentication** with role-based access
- **Rate limiting** for API protection
- **Health monitoring** for all endpoints
- **Structured logging** for debugging

## Development Workflows

### Common Development Tasks

**Adding a new AI agent:**
1. Create agent class in `examples/langgraph-backend/src/svelte_langgraph/chains/`
2. Register in `app.py` with LangGraph
3. Add to frontend endpoint list
4. Test with Socket.IO integration
5. Update documentation

**Customizing Flowbite theme:**
1. Create theme variant in `packages/svelte-langgraph/src/lib/themes/`
2. Test with all components
3. Update theme documentation
4. Add examples to demo routes

**Adding new UI components:**
1. Create component in `packages/svelte-langgraph/src/lib/components/`
2. Add Flowbite integration
3. Include in component index
4. Add to component documentation
5. Create usage examples

### Testing Strategy

**Frontend Testing:**
- **Unit tests**: Component testing with theme context
- **Integration tests**: Socket.IO communication
- **E2E tests**: Full user workflows with Playwright
- **Theme tests**: All theme variants and overrides

**Backend Testing:**
- **Unit tests**: Agent functionality and LangGraph integration
- **API tests**: FastAPI endpoints and authentication
- **Integration tests**: Real AI provider communication
- **Performance tests**: Streaming and concurrent users

### Quality Assurance (Two-Tier System)

```bash
# AUTOMATED on commit (fast): husky + lint-staged
# ✅ Formatting (prettier + ruff format)
# ✅ Linting (eslint + ruff check)
# ⚡ Runs in ~5-10 seconds

# MANUAL before push (comprehensive): 
pnpm quality

# ✅ All of the above PLUS
# ✅ Type checking (svelte-check + pyright)  
# ✅ Unit tests (vitest + pytest)
# ✅ Build verification with dependency management
# ⚡ Runs efficiently with nx caching and parallel execution

# Manual formatting commands (if needed):
pnpm format:check               # Verify code formatting
pnpm format                     # Fix formatting issues
```

## Important Files & Locations

### Key Configuration Files
- `nx.json`: Monorepo configuration
- `docker-compose.yml`: Development deployment
- `docker-compose.prod.yml`: Production deployment  
- `.env.example`: Environment template
- `examples/dashboard/tailwind.config.js`: Flowbite integration
- `examples/dashboard/src/hooks.server.ts`: Socket.IO server (700+ lines)

### Demo Routes & Examples
- `/`: Main dashboard with Flowbite components
- `/flowbite`: Flowbite theme showcase
- `/demo/paraglide`: Internationalization demo  
- `/api/health`: Backend health endpoint

### Documentation Structure
- `docs/README.md`: Main documentation entry
- `docs/getting-started/quick-start.md`: 5-minute setup
- `docs/getting-started/tutorial.md`: 30-minute tutorial
- `docs/guides/themes.md`: Flowbite theme system
- `docs/guides/deployment.md`: Production deployment
- `docs/reference/components.md`: Component library
- `docs/advanced/architecture.md`: System design
- `docs/advanced/troubleshooting.md`: Debug guide

## Troubleshooting Common Issues

### Frontend Issues
- **Theme not applied**: Ensure ThemeProvider wraps components
- **Socket connection failed**: Check backend is running on port 8000
- **Build errors**: Run `pnpm exec paraglide-js compile` first
- **Missing Flowbite styles**: Include Flowbite CSS in app.html

### Backend Issues  
- **No AI responses**: Check API keys in .env file
- **Authentication failed**: Verify JWT secret configuration
- **Import errors**: Use module path `src.svelte_langgraph.*`
- **Performance issues**: Monitor streaming message cleanup

### Docker Issues
- **Services won't start**: Check port conflicts (3000, 8000)
- **Environment variables**: Ensure .env file is properly configured
- **Build failures**: Clear Docker cache with `docker system prune`

## Production Deployment Notes

### Security Checklist
- [ ] Change SECRET_KEY to production value
- [ ] Use real database (PostgreSQL recommended)
- [ ] Configure SSL certificates
- [ ] Set up rate limiting
- [ ] Configure CORS for production domains
- [ ] Enable security headers in nginx
- [ ] Set up monitoring and logging

### Performance Optimization  
- [ ] Enable nginx gzip compression
- [ ] Configure database connection pooling
- [ ] Set up Redis for session storage
- [ ] Monitor memory usage for streaming
- [ ] Configure proper logging levels
- [ ] Set up health checks and monitoring

This CLAUDE.md file should be updated when significant architectural changes are made or new major features are added to the project.