# svelte-langserve

A high-performance SvelteKit toolkit for building custom AI frontends on top of LangServe APIs. Purpose-built for developers who need to create fast, maintainable interfaces for advanced agentic reasoning systems.

## 🎯 Problem & Solution

Building production-ready frontends for LangServe applications requires handling real-time streaming, multi-agent coordination, WebSocket management, and performance optimization. Most existing solutions are either React-specific, full frameworks, or lack the performance characteristics needed for complex AI interactions.

**svelte-langserve** solves this by providing:
- **Focused toolkit** - Does one thing well: connecting SvelteKit to LangServe
- **Performance-first** - Leverages SvelteKit's speed for responsive AI interfaces  
- **Customizable** - Components and hooks, not rigid templates
- **Production-ready** - Built-in streaming, error handling, and real-time features

## Features

- **Real-time Communication**: WebSocket-based chat with instant message delivery
- **Multi-Agent Conversations**: Connect multiple LangServe agents in a single conversation
- **Streaming Support**: Progressive message rendering as AI agents respond
- **Mobile Optimized**: Responsive UI that works on all devices
- **Auto-Discovery**: Automatically detects and connects to available LangServe endpoints
- **Health Monitoring**: Real-time endpoint status and connectivity testing
- **Internationalization**: Support for multiple languages with Inlang/Paraglide
- **Modern UI**: Clean, responsive interface built with TailwindCSS and Svelte

## 📊 Comparison with Similar Projects

| Project | Framework | Focus | Scope | LangServe Integration |
|---------|-----------|-------|-------|-----------------------|
| **svelte-langserve** *(this project)* | SvelteKit | LangServe toolkit | Focused tool for custom AI frontends | ✅ Native, optimized |
| [assistant-ui](https://github.com/assistant-ui/assistant-ui) | React | AI chat components | Comprehensive React component library | ✅ Via Vercel AI SDK |
| [langserve-assistant-ui](https://github.com/hminle/langserve-assistant-ui) | Next.js | LangServe + assistant-ui | Full-stack template with specific UI | ✅ Direct integration |
| [Vercel AI SDK](https://github.com/vercel/ai) | Multi-framework | General AI integration | Broad AI SDK with multiple providers | ✅ Via adapters |
| [sveltekit-ai-chatbot](https://github.com/jianyuan/sveltekit-ai-chatbot) | SvelteKit | OpenAI/general AI | Full chatbot application | ❌ OpenAI-focused |
| LangServe Playground | Built-in | LangServe testing | Basic development UI | ✅ Built-in |

### Why svelte-langserve?

- **Only SvelteKit-native LangServe toolkit** - Purpose-built for the framework
- **Performance-optimized** - Faster than React alternatives for real-time AI interactions
- **Toolkit approach** - Build exactly what you need, not what someone else designed
- **Production-grade** - Handles streaming, error recovery, and WebSocket management
- **Extensible** - Hooks for auth, persistence, and custom integrations

## 🏗️ Architecture

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

### Components

- **SvelteKit Frontend**: Modern, reactive UI with WebSocket integration
- **Socket.IO Server**: Integrated directly in SvelteKit hooks.server.ts
- **LangServe Client Manager**: Connects to and manages multiple LangServe backends
- **LangServe Backends**: AI agents built with LangChain and served via LangServe

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Python 3.11+ (for LangServe backend)
- Docker & Docker Compose (optional)
- API keys for OpenAI, Anthropic, etc.

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/svelte-langserve.git
cd svelte-langserve
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add your API keys to .env
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

### 3. Docker Deployment (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Manual Setup

#### Start LangServe Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### Start SvelteKit Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### 5. Access the Application

- **Web Interface**: http://localhost:5173 (dev) or http://localhost:3000 (prod)
- **LangServe API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:3000/api/langserve

## 🎯 Usage Examples

### Creating a Multi-Agent Conversation

```svelte
<script>
  import { LangServeFrontend } from '$lib/langserve';
</script>

<LangServeFrontend 
  userId="user123" 
  serverUrl="http://localhost:3000"
/>
```

### Socket.IO Events

#### Client → Server

```typescript
// Join conversation with specific agents
socket.emit('create_conversation', {
  endpoint_ids: ['chatbot', 'code-assistant'],
  initial_message: 'Hello!',
  config: { temperature: 0.7, streaming: true }
});

// Send message
socket.emit('send_message', {
  conversation_id: 'conv_123',
  content: 'Explain quantum computing',
  config: { temperature: 0.8 }
});
```

#### Server → Client

```typescript
// Receive messages
socket.on('message_received', (message) => {
  console.log('New message:', message);
});

// Handle streaming chunks
socket.on('message_chunk', (chunk) => {
  updateStreamingMessage(chunk.message_id, chunk.content);
});

// Agent response complete
socket.on('agent_response_complete', (message) => {
  finalizeMessage(message);
});
```

## 🛠️ Configuration

### LangServe Endpoints

Configure available AI agents in your Socket.IO server:

```typescript
const langserveConfig = {
  endpoints: [
    {
      id: 'chatbot',
      name: 'General Assistant',
      url: 'http://localhost:8000/chatbot',
      description: 'General-purpose conversational AI'
    },
    {
      id: 'code-assistant',
      name: 'Code Expert',
      url: 'http://localhost:8000/code-assistant',
      description: 'Specialized coding assistant'
    },
    {
      id: 'data-analyst',
      name: 'Data Scientist',
      url: 'http://localhost:8000/data-analyst',
      description: 'Data analysis with search tools'
    }
  ],
  default_config: {
    temperature: 0.7,
    streaming: true
  }
};
```

### Environment Variables

```bash
# Frontend environment variables
PUBLIC_SOCKET_IO_URL=http://localhost:3000
PUBLIC_LANGSERVE_CHATBOT_URL=http://localhost:8000/chatbot
PUBLIC_LANGSERVE_CODE_URL=http://localhost:8000/code-assistant
PUBLIC_LANGSERVE_DATA_URL=http://localhost:8000/data-analyst
```

## Project Structure

```
svelte-langserve/
├── backend/               # LangServe backend Python implementation
├── frontend/              # SvelteKit frontend implementation
│   ├── src/
│   │   ├── lib/
│   │   │   ├── langserve/ # LangServe frontend library
│   │   │   │   ├── components/ # Svelte components
│   │   │   │   ├── stores/     # Svelte stores
│   │   │   │   └── types/      # TypeScript type definitions
│   │   ├── routes/       # SvelteKit routes
│   │   └── hooks.server.ts # Server-side Socket.IO setup
│   ├── static/           # Static assets
│   └── messages/         # i18n message files
└── deployment_implementation.txt # Deployment configuration
```

## 🚀 Deployment

See [deployment_implementation.txt](./deployment_implementation.txt) for detailed deployment instructions.

## 📚 API Documentation

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `authenticate` | Client → Server | Authenticate user session |
| `create_conversation` | Client → Server | Start new multi-agent conversation |
| `send_message` | Client → Server | Send message to conversation |
| `message_received` | Server → Client | New message from user or agent |
| `message_chunk` | Server → Client | Streaming message chunk |
| `agent_response_complete` | Server → Client | Agent finished responding |
| `test_endpoint` | Client → Server | Test LangServe endpoint health |

### Message Format

```typescript
interface ChatMessage {
  id: string;
  type: 'human' | 'ai' | 'system' | 'tool';
  content: string | any[];
  sender_id: string;
  sender_type: 'user' | 'agent';
  timestamp: string;
  conversation_id: string;
  additional_kwargs?: Record<string, any>;
}
```

## 🔧 Development

### Local Development

```bash
# Start backend in development mode
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Start frontend in development mode
cd frontend
pnpm install
pnpm dev
```

### Testing

```bash
# Frontend tests
cd frontend
pnpm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **LangChain Team** for the amazing LangChain framework
- **LangServe** for the standardized AI agent deployment
- **Socket.IO** for real-time communication infrastructure
- **SvelteKit** for the powerful frontend framework
- **TailwindCSS** for the utility-first CSS framework
- **Inlang/Paraglide** for the internationalization support

---

**Made with ❤️ by Claude**
