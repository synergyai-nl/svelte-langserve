# Svelte LangServe

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **monorepo** containing reusable packages and examples for building SvelteKit dashboards that interact with LangServe backends. Features real-time chat, Socket.IO integration, and production-ready Docker deployment.

## ✨ Features

### 📦 Reusable Packages
- **@svelte-langserve/core**: Socket.IO client, stores, and connection management
- **@svelte-langserve/ui**: Pre-built Svelte components for chat interfaces
- **@svelte-langserve/types**: Shared TypeScript definitions
- **@svelte-langserve/codegen**: Code generation utilities

### 🚀 Example Application Features
- **🔐 JWT Authentication**: Secure user authentication with password hashing and token management
- **⚡ Real-time Communication**: WebSocket-based chat with instant message delivery
- **🤖 Multiple AI Assistants**: 5 specialized agents (chatbot, code assistant, data analyst, creative writer, research assistant)
- **📺 Streaming Support**: Progressive message rendering as AI agents respond
- **🐳 Docker Deployment**: Complete containerized setup with nginx reverse proxy
- **🎨 Modern UI**: Clean, responsive interface built with SvelteKit and TailwindCSS
- **🌍 Internationalization**: Multi-language support with Inlang/Paraglide
- **📊 Health Monitoring**: Real-time endpoint status and connectivity testing
- **📱 Mobile Optimized**: Responsive design that works on all devices

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- API keys for OpenAI, Anthropic (and optionally Tavily)

### Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd claude-rocks-the-dashboard

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# View the dashboard
open http://localhost:3000

# Login with demo credentials
# Username: demo or admin
# Password: secret
```

### Development Setup

#### Frontend Development

```bash
cd examples/dashboard
pnpm install
pnpm dev
```

#### Backend Development

```bash
cd examples/langserve-backend
uv run serve
# or
uv run uvicorn src.svelte_langserve.main:create_app --factory --reload
```

## 🏗 Project Structure

### Monorepo Layout
```
svelte-langserve/
├── packages/@svelte-langserve/     # 📦 Reusable npm packages
│   ├── core/                       #    Connection logic & stores
│   ├── ui/                         #    Svelte components library
│   ├── types/                      #    Shared TypeScript definitions
│   └── codegen/                    #    Code generation utilities
├── examples/                       # 🚀 Example applications  
│   ├── dashboard/                  #    SvelteKit frontend demo
│   └── langserve-backend/          #    FastAPI backend demo
├── nginx/                          # 🌐 Nginx reverse proxy config
├── docker-compose.yml              # 🐳 Multi-service deployment
└── nx.json                         # ⚡ Nx monorepo configuration
```

### Key Directories
- **[packages/@svelte-langserve](./packages/@svelte-langserve/)** - Reusable libraries for any SvelteKit project
- **[examples/dashboard](./examples/dashboard)** - Complete SvelteKit frontend example
- **[examples/langserve-backend](./examples/langserve-backend)** - FastAPI backend with 5 AI agents
- **[nginx/](./nginx/)** - Production nginx configuration
- **[docker-compose.yml](./docker-compose.yml)** - Full-stack Docker deployment

## 🛠 Development

### Frontend Commands

```bash
cd examples/dashboard

# Development
pnpm install
pnpm dev

# Testing
pnpm test
pnpm test:e2e

# Build
pnpm build
pnpm preview

# Code quality
pnpm check     # Type checking
pnpm lint      # ESLint
pnpm format    # Prettier
```

### Backend Commands

```bash
cd examples/langserve-backend

# Development
uv run serve
uv run uvicorn src.svelte_langserve.main:create_app --factory --reload

# Code quality
uv run ruff check .    # Lint
uv run ruff format .   # Format
uv run pytest         # Test
uv run pyright         # Type checking
```

### Package Development

```bash
# Install all dependencies (run from root)
pnpm install

# Build all packages
nx run-many -t build

# Test all packages
nx run-many -t test

# Lint all packages
nx run-many -t lint

# Work on specific package
cd packages/@svelte-langserve/core
pnpm build
pnpm test:watch

# Publish packages (when ready)
pnpm changeset
pnpm version-packages
pnpm release
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f svelte-frontend
docker-compose logs -f langserve-backend

# Rebuild services
docker-compose up -d --build

# Stop services
docker-compose down
```

## 📖 Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/Streaming    ┌─────────────────┐
│   Browser/Web   │ ◄─────────────► │   SvelteKit     │ ◄──────────────────► │   LangServe     │
│     Client      │                 │    Frontend     │                      │    Backend      │
└─────────────────┘                 └─────────────────┘                      └─────────────────┘
                                            │                                         │
                                            ▼                                         ▼
                                    ┌─────────────────┐                      ┌─────────────────┐
                                    │    Socket.IO    │                      │   5 AI Agents   │
                                    │     Server      │                      │   OpenAI/Claude │
                                    └─────────────────┘                      └─────────────────┘
```

## 🤖 Available AI Agents

1. **General Chatbot** - Conversational AI for general questions and discussions
2. **Code Assistant** - Specialized in programming, debugging, and technical help
3. **Data Analyst** - Expert in data analysis, visualization, and insights
4. **Creative Writer** - Storytelling, creative writing, and content generation
5. **Research Assistant** - Information gathering and research with web search capabilities

## 🌍 Environment Variables

Required API keys (add to `.env`):

```bash
# Required
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional (for research agent)
TAVILY_API_KEY=your-tavily-api-key-here

# Authentication (change in production)
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🔐 Authentication

The application uses JWT-based authentication to secure API access:

### Demo Credentials

For development and testing:
- **Username**: `demo` or `admin`
- **Password**: `secret`

### Authentication Flow

1. **Login**: POST to `/token` with username/password
2. **Access**: Include JWT token in `Authorization: Bearer <token>` header
3. **User Info**: GET `/users/me` to retrieve current user details
4. **Protected Routes**: All LangServe endpoints require authentication

### Security Features

- Password hashing with bcrypt
- JWT token expiration (30 minutes default)
- Secure token storage in browser localStorage
- Automatic logout on token expiration

### Production Setup

For production deployment:

1. Change the `SECRET_KEY` environment variable
2. Replace demo users with a proper user database
3. Implement user registration/management
4. Consider implementing refresh tokens for longer sessions

## 📋 Current Architecture Issues

This project is in active development. See [TODO.md](./TODO.md) for planned improvements:

- **Code duplication**: Examples contain duplicated store logic instead of using packages
- **Monolithic files**: `hooks.server.ts` (657 lines) needs refactoring into services
- **Missing abstractions**: Configuration scattered throughout codebase
- **Package underutilization**: Reusable packages need more functionality

## 🤝 Contributing

We welcome contributions! Please see [TODO.md](./TODO.md) for architectural improvements in progress.

## 📄 License

MIT © [Svelte LangServe contributors](LICENSE)