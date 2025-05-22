# LangServe Socket.IO Frontend

> Real-time, multi-user frontend for LangServe AI agents with streaming support

Transform your LangServe AI agents into real-time, collaborative chat applications. This project provides a Socket.IO-based frontend that connects to LangServe backends, enabling live conversations with multiple AI agents simultaneously.

## 🚀 Features

- **Real-time Communication**: WebSocket-based chat with instant message delivery
- **Multi-Agent Conversations**: Connect multiple LangServe agents in a single conversation
- **Streaming Support**: Progressive message rendering as AI agents respond
- **Mobile Optimized**: Efficient connection management for mobile applications
- **Auto-Discovery**: Automatically detects and connects to available LangServe endpoints
- **Health Monitoring**: Real-time endpoint status and connectivity testing
- **Schema Introspection**: Fetches and validates input/output schemas from LangServe
- **Scalable Architecture**: Redis-backed Socket.IO with multi-server support

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/Streaming    ┌─────────────────┐
│   Mobile/Web    │ ◄──────────────► │   Socket.IO     │ ◄───────────────────► │   LangServe     │
│     Client      │                 │    Frontend     │                      │    Backends     │
└─────────────────┘                 └─────────────────┘                      └─────────────────┘
                                            │                                         │
                                            ▼                                         ▼
                                    ┌─────────────────┐                      ┌─────────────────┐
                                    │     Redis       │                      │   ChatGPT-4     │
                                    │   (Scaling)     │                      │   Claude-3      │
                                    └─────────────────┘                      │   Custom LLMs   │
                                                                             └─────────────────┘
```

### Components

- **Socket.IO Frontend Server**: Real-time communication hub
- **LangServe Client Manager**: Connects to and manages multiple LangServe backends
- **Mobile/Web Clients**: React/React Native applications with real-time chat
- **LangServe Backends**: AI agents built with LangChain and served via LangServe

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (optional)
- API keys for OpenAI, Anthropic, etc.

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/langserve-socketio-frontend.git
cd langserve-socketio-frontend
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add your API keys to .env
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
TAVILY_API_KEY=your-tavily-key-here
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
python langserve_backend.py
```

#### Start Socket.IO Frontend

```bash
cd frontend
npm install
npm run build
npm start
```

### 5. Access the Application

- **Web Interface**: http://localhost:3000
- **LangServe API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:3000/health

## 🎯 Usage Examples

### Creating a Multi-Agent Conversation

```typescript
import { useLangServeFrontend } from './useLangServeFrontend';

function ChatApp() {
  const langserve = useLangServeFrontend('ws://localhost:3000', 'user123');

  // Create conversation with multiple agents
  const startConversation = () => {
    langserve.createConversation(
      ['chatbot', 'code-assistant', 'data-analyst'], // Multiple agents
      'Help me build a data dashboard',
      { temperature: 0.7, streaming: true }
    );
  };

  // Send message to all agents
  const sendMessage = (message: string) => {
    langserve.sendMessage(conversationId, message, {
      streaming: true,
      temperature: 0.7
    });
  };

  return (
    <ChatInterface
      messages={langserve.getDisplayMessages(conversationId)}
      onSendMessage={sendMessage}
      streamingMessages={langserve.streamingMessages}
    />
  );
}
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
# Backend URLs (auto-configured in Docker)
LANGSERVE_CHATBOT_URL=http://localhost:8000/chatbot
LANGSERVE_CODE_URL=http://localhost:8000/code-assistant
LANGSERVE_DATA_URL=http://localhost:8000/data-analyst

# Scaling & Persistence
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgres://user:pass@localhost:5432/langserve_chat

# Security
JWT_SECRET=your-jwt-secret-key
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 🚀 Deployment

### Production with Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Scale Socket.IO servers
docker-compose up --scale socketio-frontend=3

# Scale LangServe backends
docker-compose up --scale langserve-backend=3
```

### Kubernetes

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: socketio-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: socketio-frontend
  template:
    metadata:
      labels:
        app: socketio-frontend
    spec:
      containers:
      - name: socketio-frontend
        image: your-registry/socketio-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
```

### Cloud Platforms

- **Heroku**: Use the included `Procfile`
- **AWS ECS**: Use the Docker images
- **Google Cloud Run**: Serverless deployment
- **Railway/Render**: One-click deployment

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

### LangServe Endpoints

Each LangServe backend exposes:

- `POST /invoke` - Single message processing
- `POST /stream` - Streaming response
- `POST /batch` - Batch processing
- `GET /input_schema` - Input validation schema
- `GET /output_schema` - Output schema
- `GET /playground` - Interactive testing interface

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
npm install
npm run dev

# Start Redis (for scaling features)
docker run -p 6379:6379 redis:alpine
```

### Adding New LangServe Agents

1. **Create LangChain chain** in `backend/`
2. **Add route** in `langserve_backend.py`
3. **Configure endpoint** in Socket.IO frontend
4. **Test integration** via health checks

```python
# Example: Add new agent
def create_translator_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert translator..."),
        MessagesPlaceholder(variable_name="messages"),
    ])
    return prompt | ChatOpenAI() | StrOutputParser()

# Add to FastAPI
add_routes(app, create_translator_chain(), path="/translator")
```

### Testing

```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

## 📱 Mobile Integration

### React Native

```typescript
import { useLangServeFrontend } from '@langserve/react-native-client';

export function MobileChatScreen() {
  const chat = useLangServeFrontend('wss://your-domain.com', userId);

  return (
    <ChatInterface
      messages={chat.getDisplayMessages(conversationId)}
      onSendMessage={chat.sendMessage}
      onTypingStart={() => chat.startTyping(conversationId)}
      onTypingStop={() => chat.stopTyping(conversationId)}
    />
  );
}
```

### Flutter/iOS/Android

Use Socket.IO client libraries:
- **Flutter**: `socket_io_client`
- **iOS**: `Socket.IO-Client-Swift`
- **Android**: `Socket.IO Java Client`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript/Python type hints
- Add tests for new features
- Update documentation
- Use conventional commits
- Ensure Docker builds pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LangChain Team** for the amazing LangChain framework
- **LangServe** for the standardized AI agent deployment
- **Socket.IO** for real-time communication infrastructure
- **FastAPI** for the high-performance API framework

## 📞 Support

- **Documentation**: [docs.your-domain.com](https://docs.your-domain.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/langserve-socketio-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/langserve-socketio-frontend/discussions)
- **Discord**: [Join our community](https://discord.gg/your-invite)

---

**Made with ❤️ by the LangServe Socket.IO Frontend team**
