# Svelte LangGraph

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Svelte](https://img.shields.io/badge/Svelte-5.0-orange.svg)](https://svelte.dev/)
[![Flowbite](https://img.shields.io/badge/Flowbite-2.0-blue.svg)](https://flowbite.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Server-green.svg)](https://langchain-ai.github.io/langgraph/)

> **Build beautiful AI chat applications with SvelteKit, Flowbite UI, and LangGraph in minutes, not months.**

A complete, production-ready framework for creating real-time AI chat applications with professional Flowbite components, advanced LangGraph assistants, streaming responses, and enterprise-grade deployment capabilities.

## 🎨 **Beautiful by Default with Flowbite**

Experience the power of professional design systems with our integrated Flowbite theme:

- 🎯 **50+ Pre-built Components** - Buttons, cards, modals, forms ready to use
- 🌙 **Dark/Light Mode** - Automatic theme switching with user preferences  
- 📱 **Mobile-First Design** - Responsive components that work everywhere
- ♿ **Accessibility Built-in** - WCAG compliant out of the box
- 🎨 **Customizable Themes** - Easy branding and styling system

```svelte
<!-- Beautiful AI chat in one component -->
<script>
  import { LangGraphFrontend } from 'svelte-langgraph';
</script>

<LangGraphFrontend 
  userId="user123" 
  theme="flowbite"
  darkMode={true}
/>
```

## ✨ **Enterprise Features**

### 🤖 **Advanced LangGraph System**
- **6 Specialized Graphs**: Chatbot, Persistent Chatbot, Code Assistant, Data Analyst, Creative Writer, Research Assistant
- **Open-Source LangGraph**: Uses standard StateGraph/CompiledGraph - no Platform dependency required
- **Optional Platform Support**: Can be extended to use LangGraph Platform if desired
- **Thread-based Conversations**: Stateful conversations with automatic persistence (in-memory or external)
- **Multiple AI Providers**: OpenAI GPT-4, Anthropic Claude, with easy extensibility
- **Streaming Responses**: Real-time token-by-token response rendering
- **Tool Integration**: Web search, data analysis, and custom tools with intelligent routing

### 🔐 **Production Security**
- **JWT Authentication**: Secure token-based auth with role-based access control
- **Rate Limiting**: Built-in protection against abuse and spam
- **Input Validation**: Comprehensive sanitization and validation
- **Security Headers**: CORS, CSP, and other security best practices

### ⚡ **Real-time Communication**
- **Modular Socket.IO Architecture**: Clean, maintainable WebSocket implementation
- **Conversation Management**: Thread-based conversation persistence (configurable backend)
- **Graph Health Monitoring**: Real-time status tracking for all LangGraph instances
- **Memory Management**: Advanced streaming with automatic cleanup
- **Connection Resilience**: Automatic reconnection and graceful error handling

### 🐳 **Deployment Ready**
- **Docker Compose**: One-command deployment with optional Postgres + Redis
- **Production Config**: Nginx, SSL, monitoring, and comprehensive health checks
- **Flexible Persistence**: In-memory (default) or PostgreSQL for conversation storage
- **Optional Task Queue**: Redis support for advanced workflows
- **Cloud Ready**: AWS, GCP, Azure deployment examples
- **CI/CD Pipelines**: GitHub Actions workflows included

## 🚀 **Quick Start**

### Option 1: Docker (Recommended)

Get everything running in under 2 minutes:

```bash
# 1. Clone and setup
git clone https://github.com/synergyai-nl/svelte-langgraph.git
cd svelte-langgraph

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys:
# OPENAI_API_KEY=your-key-here
# ANTHROPIC_API_KEY=your-key-here
# LANGSMITH_API_KEY=your-langsmith-key

# 3. Launch everything
docker-compose up -d

# 4. Open your browser
open http://localhost:3000
```

**Demo credentials:** `demo` / `secret`

### Option 2: Development Setup

For customization and development:

```bash
# Optional: Infrastructure for persistence (Terminal 1)
docker-compose up -d postgres redis

# Backend (Terminal 2)
cd examples/langgraph-backend
uv run serve

# Frontend (Terminal 3)  
cd examples/dashboard
pnpm install && pnpm dev

# Visit http://localhost:5173
```

## 📖 **Comprehensive Documentation**

Our worldclass documentation covers everything from 5-minute quickstart to enterprise deployment:

### 🚀 **[Getting Started](./docs/getting-started/)**
- **[Quick Start](./docs/getting-started/quick-start.md)** - Docker + development setup in 5 minutes
- **[Complete Tutorial](./docs/getting-started/tutorial.md)** - Build your first AI app in 30 minutes

### 📖 **[Guides](./docs/guides/)**
- **[Flowbite Theme System](./docs/guides/themes.md)** - Customize UI with professional components
- **[Authentication & Security](./docs/guides/authentication.md)** - JWT, RBAC, and security best practices
- **[Production Deployment](./docs/guides/deployment.md)** - Docker, Kubernetes, cloud platforms

### 📋 **[API Reference](./docs/reference/)**
- **[Component Library](./docs/reference/components.md)** - Complete Svelte component documentation
- **[Socket.IO Events](./docs/reference/api/socket-events.md)** - Real-time event reference
- **[Store APIs](./docs/reference/api/stores.md)** - State management and reactive patterns

### 🔧 **[Advanced](./docs/advanced/)**
- **[Architecture Deep Dive](./docs/advanced/architecture.md)** - System design and patterns
- **[Troubleshooting Guide](./docs/advanced/troubleshooting.md)** - Debug and fix common issues

## 🏗️ **Architecture Overview**

Built with modern, scalable architecture patterns:

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/Streaming    ┌─────────────────┐
│   Browser       │ ◄─────────────► │   SvelteKit     │ ◄──────────────────► │   FastAPI       │
│   (Flowbite UI) │                 │   Frontend      │                      │   LangGraph     │
└─────────────────┘                 └─────────────────┘                      └─────────────────┘
                                            │                                         │
                                            ▼                                         ▼
                                    ┌─────────────────┐                      ┌─────────────────┐
                                    │    Socket.IO    │                      │ LangGraph Server│
                                    │     Server      │                      │ + AI Assistants │
                                    └─────────────────┘                      └─────────────────┘
```

### **Modern Tech Stack**
- **Frontend**: SvelteKit 2.0 + Svelte 5 + TypeScript + Tailwind CSS v4
- **UI Components**: Flowbite Svelte with comprehensive theme system
- **Backend**: FastAPI + LangGraph (open-source) + LangChain + Socket.IO
- **AI Integration**: OpenAI GPT-4, Anthropic Claude, extensible agent system
- **Database**: Optional PostgreSQL + Redis (in-memory by default)
- **Deployment**: Docker Compose + Nginx + SSL + monitoring

## 🎯 **Use Cases**

Perfect for building:

- **🤖 AI Chat Applications** - Customer support, personal assistants
- **💻 Code Assistant Tools** - Developer productivity, code review
- **📊 Data Analysis Platforms** - Business intelligence, reporting  
- **✍️ Content Creation** - Writing assistants, creative tools
- **🔍 Research Applications** - Information gathering, analysis
- **🏢 Enterprise Chatbots** - Internal tools, knowledge management

## 📦 **Package Structure**

### **Monorepo Organization**
```
svelte-langgraph/
├── packages/
│   └── svelte-langgraph/           # 📦 Complete library package
│       ├── components/             #    Flowbite UI components
│       ├── stores/                 #    Socket.IO & state management  
│       ├── themes/                 #    Flowbite theme system
│       └── types.ts                #    LangChain-compatible types
├── examples/
│   ├── dashboard/                  # 🎨 SvelteKit frontend example
│   └── langgraph-backend/          # 🚀 FastAPI backend example
├── docs/                           # 📚 Comprehensive documentation
├── nginx/                          # 🌐 Production nginx config
└── docker-compose.yml              # 🐳 Full-stack deployment
```

### **Key Features by Package**

**📦 `svelte-langgraph` Package:**
- Complete Svelte integration for LangGraph
- Socket.IO client with automatic reconnection
- Flowbite theme system with dark mode
- TypeScript definitions for LangChain compatibility
- Reactive stores for real-time state management

**🎨 Frontend Example:**
- Professional Flowbite UI components
- Real-time chat with streaming responses
- Multi-conversation management
- User authentication and authorization
- Internationalization with Inlang/Paraglide

**🚀 Backend Example:**
- 6 specialized LangGraph StateGraph implementations
- FastAPI with open-source LangGraph integration
- JWT authentication with RBAC
- Socket.IO server for real-time communication
- Production-ready logging and monitoring

## 🌟 **Flowbite Integration Highlights**

### **Professional Design System**
```svelte
<!-- Automatic Flowbite theming -->
<LangGraphFrontend userId="user123" theme="flowbite" />

<!-- Custom theme variants -->
<ThemeProvider theme={flowbiteTheme} variant="dark">
  <ChatInterface />
</ThemeProvider>

<!-- Runtime theme customization -->
<ThemeProvider theme={customTheme} override={brandColors}>
  <LangGraphFrontend userId="user123" />
</ThemeProvider>
```

### **Component Examples**
- **Chat Interface**: Professional message bubbles with avatars
- **Sidebar Navigation**: Collapsible conversation list with search
- **Settings Panel**: Form controls with validation and feedback
- **Loading States**: Skeleton screens and progress indicators
- **Error Handling**: Toast notifications and error boundaries

### **Responsive Design**
- **Desktop**: Full-featured layout with sidebars and panels
- **Tablet**: Adaptive layout with collapsible navigation
- **Mobile**: Touch-optimized interface with bottom navigation

## 🚀 **Getting Started Paths**

Choose your journey:

| **I want to...** | **Start here** | **Time needed** |
|-------------------|----------------|-----------------|
| **Try it quickly** | [Quick Start](./docs/getting-started/quick-start.md) | 5 minutes |
| **Learn step-by-step** | [Complete Tutorial](./docs/getting-started/tutorial.md) | 30 minutes |  
| **Customize the UI** | [Flowbite Theme Guide](./docs/guides/themes.md) | 15 minutes |
| **Deploy to production** | [Deployment Guide](./docs/guides/deployment.md) | 1 hour |
| **Understand the architecture** | [Architecture Deep Dive](./docs/advanced/architecture.md) | 20 minutes |

## 💡 **Live Examples**

Explore these demo routes in the example app:

- **`/`** - Main dashboard with Flowbite components
- **`/flowbite`** - Flowbite theme showcase
- **`/demo/paraglide`** - Internationalization demo
- **`/api/health`** - Backend health check endpoint

## 🛠️ **Development**

### **Quick Development Setup**
```bash
# Install all dependencies (monorepo)
pnpm install

# Start backend
cd examples/langgraph-backend && uv run serve

# Start frontend (new terminal)
cd examples/dashboard && pnpm dev

# Visit http://localhost:5173
```

### **Package Development**
```bash
# Build library package
cd packages/svelte-langgraph && pnpm build

# Run all tests
nx run-many -t test

# Lint and type check
nx run-many -t lint,check
```

### **Quality Assurance**
```bash
# Run all quality checks
nx run-many -t test,lint,check --output-style=stream

# Frontend-specific
cd examples/dashboard
pnpm test        # Unit tests
pnpm test:e2e    # End-to-end tests
pnpm check       # TypeScript check
pnpm lint        # ESLint
pnpm format      # Prettier

# Backend-specific  
cd examples/langgraph-backend
uv run pytest           # Unit tests
uv run ruff check .     # Lint
uv run ruff format .    # Format
uv run pyright          # Type check
```

## 🐳 **Production Deployment**

### **Docker Compose (Recommended)**
```bash
# Production deployment
cp .env.example .env  # Configure with real API keys
docker-compose -f docker-compose.prod.yml up -d

# Includes:
# - Nginx reverse proxy with SSL
# - PostgreSQL database
# - Redis for session storage  
# - Prometheus + Grafana monitoring
```

### **Cloud Platforms**
- **AWS**: ECS + RDS deployment example
- **Google Cloud**: Cloud Run + Cloud SQL example  
- **Vercel**: Frontend deployment with serverless backend
- **Kubernetes**: Complete K8s manifests with ingress

See the [Deployment Guide](./docs/guides/deployment.md) for detailed instructions.

## 🔒 **Security & Authentication**

- **JWT Tokens**: Secure authentication with configurable expiration
- **Role-Based Access**: User, moderator, and admin permission levels
- **Rate Limiting**: API protection against abuse and spam
- **Input Validation**: Comprehensive sanitization with Pydantic
- **Security Headers**: CORS, CSP, and other security best practices
- **SSL/TLS**: Production-ready HTTPS configuration

## 📊 **Monitoring & Observability**

- **Health Checks**: Comprehensive endpoint monitoring
- **Structured Logging**: JSON logs with correlation IDs
- **Metrics Collection**: Prometheus metrics for all services
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Response time and throughput tracking

## 🤝 **Contributing**

We welcome contributions! See our [Contributing Guide](./docs/contributing/) for:

- **Development Setup**: Local environment configuration
- **Code Standards**: TypeScript, ESLint, and formatting rules
- **Testing Guidelines**: Unit, integration, and E2E testing
- **Pull Request Process**: Review and merge workflow

## 📄 **License**

MIT © [Svelte LangServe Contributors](LICENSE)

## 🆘 **Support**

- 📖 **Documentation**: [docs/](./docs/) - Complete guides and API reference
- 🐛 **Issues**: [GitHub Issues](https://github.com/synergyai-nl/svelte-langgraph/issues) - Bug reports and feature requests
- 💬 **Discussions**: [GitHub Discussions](https://github.com/synergyai-nl/svelte-langgraph/discussions) - Questions and community
- 🔧 **Troubleshooting**: [Troubleshooting Guide](./docs/advanced/troubleshooting.md) - Debug common issues

## 🎉 **What's Next?**

Ready to build amazing AI applications? **[Start with our 5-minute Quick Start Guide →](./docs/getting-started/quick-start.md)**

---

<div align="center">

**Built with ❤️ using SvelteKit, Flowbite, and LangGraph**

[Documentation](./docs/) • [Quick Start](./docs/getting-started/quick-start.md) • [Live Demo](http://localhost:3000) • [GitHub](https://github.com/synergyai-nl/svelte-langgraph)

</div>