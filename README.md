# Claude Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready SvelteKit dashboard for interacting with multiple AI assistants via LangServe backends. Features real-time chat, Socket.IO integration, and Docker deployment support.

## ✨ Features

- **Real-time Communication**: WebSocket-based chat with instant message delivery
- **Multiple AI Assistants**: 5 specialized agents (chatbot, code assistant, data analyst, creative writer, research assistant)
- **Streaming Support**: Progressive message rendering as AI agents respond
- **Docker Deployment**: Complete containerized setup with nginx reverse proxy
- **Modern UI**: Clean, responsive interface built with SvelteKit and TailwindCSS
- **Internationalization**: Multi-language support with Inlang/Paraglide
- **Health Monitoring**: Real-time endpoint status and connectivity testing
- **Mobile Optimized**: Responsive design that works on all devices

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
uv run uvicorn src.claude_dashboard_backend.main:create_app --factory --reload
```

## 🏗 Project Structure

- **[examples/dashboard](./examples/dashboard)** - SvelteKit frontend with Socket.IO integration
- **[examples/langserve-backend](./examples/langserve-backend)** - FastAPI backend with 5 specialized AI agents
- **[nginx/](./nginx/)** - Nginx reverse proxy configuration
- **[docker-compose.yml](./docker-compose.yml)** - Multi-service Docker deployment

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
uv run uvicorn src.claude_dashboard_backend.main:create_app --factory --reload

# Code quality
uv run ruff check .    # Lint
uv run ruff format .   # Format
uv run pytest         # Test
uv run mypy src/       # Type checking
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
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## 📄 License

MIT © [Claude Dashboard contributors](LICENSE)