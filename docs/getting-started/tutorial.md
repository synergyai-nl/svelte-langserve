# Complete Tutorial: Build Your First AI Chat App

Learn to build a production-ready AI chat application with Svelte LangGraph and Flowbite UI components. This tutorial takes you from zero to a fully functional app in 30 minutes.

## 🎯 What We'll Build

By the end of this tutorial, you'll have:

- ✅ **Multi-agent AI chat** - ChatGPT, Claude, and specialized agents
- ✅ **Beautiful Flowbite UI** - Professional components with dark mode
- ✅ **Real-time messaging** - Socket.IO streaming responses
- ✅ **User authentication** - JWT-based security
- ✅ **Custom themes** - Personalized styling system
- ✅ **Production deployment** - Docker containerization

## 📋 Prerequisites

- Basic knowledge of JavaScript/TypeScript
- Familiarity with Svelte (helpful but not required)
- API keys for OpenAI and/or Anthropic
- 30 minutes of your time

## 🏗️ Tutorial Structure

### Part 1: Foundation (10 minutes)
1. [Project setup and architecture](#part-1-foundation)
2. [Understanding the codebase](#understanding-the-codebase)
3. [Running your first chat](#running-your-first-chat)

### Part 2: Customization (15 minutes)
4. [Customizing Flowbite themes](#part-2-customization)
5. [Building a custom agent](#building-a-custom-agent)
6. [Adding authentication](#adding-authentication)

### Part 3: Production (5 minutes)
7. [Deployment and scaling](#part-3-production)
8. [Monitoring and troubleshooting](#monitoring-and-troubleshooting)

---

## Part 1: Foundation

### Step 1: Project Setup

Let's start by getting the project running:

```bash
# Clone the repository
git clone https://github.com/synergyai-nl/svelte-langgraph.git
cd svelte-langgraph

# Setup environment variables
cp .env.example .env
```

Edit your `.env` file with real API keys:

```bash
# Get these from your providers:
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Authentication settings
SECRET_KEY=your-super-secret-jwt-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Step 2: Understanding the Architecture

Our application follows this data flow:

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP    ┌─────────────────┐
│   Browser       │ ◄─────────────► │   SvelteKit     │ ◄────────► │   FastAPI       │
│   (Flowbite UI) │                 │   Frontend      │            │   LangGraph     │
└─────────────────┘                 └─────────────────┘            └─────────────────┘
                                            │                               │
                                            ▼                               ▼
                                    ┌─────────────────┐            ┌─────────────────┐
                                    │    Socket.IO    │            │   AI Agents     │
                                    │     Server      │            │  (5 different)  │
                                    └─────────────────┘            └─────────────────┘
```

Key components:
- **Frontend**: SvelteKit + Flowbite UI + Socket.IO client
- **Backend**: FastAPI + LangGraph + Socket.IO server
- **AI Layer**: Multiple specialized agents (chatbot, code assistant, etc.)

### Step 3: Start the Application

```bash
# Option 1: Docker (recommended for beginners)
docker-compose up -d
open http://localhost:3000

# Option 2: Development mode
# Terminal 1 - Backend
cd examples/langgraph-backend
uv run serve

# Terminal 2 - Frontend  
cd examples/dashboard
pnpm install && pnpm dev
open http://localhost:5173
```

### Step 4: Your First Chat

1. **Login**: Use credentials `demo` / `secret`
2. **Select Agent**: Choose "General Chatbot"
3. **Send Message**: Type "Hello! Can you help me build an AI app?"
4. **Watch Magic**: See the streaming response appear in real-time

**🎉 Congratulations!** You've successfully run your first AI chat.

### Understanding What Happened

When you sent that message:

1. **Frontend** captured your input and sent it via Socket.IO
2. **Socket.IO server** received the message and routed it to the selected agent
3. **LangGraph backend** processed the message with the AI model (OpenAI/Anthropic)
4. **Streaming response** came back through the same WebSocket connection
5. **Flowbite UI** rendered the response with beautiful styling

---

## Part 2: Customization

### Step 5: Customizing Flowbite Themes

Let's personalize the UI. Visit `http://localhost:5173/flowbite` to see the current theme.

Create a custom theme file:

```typescript
// examples/dashboard/src/lib/custom-theme.ts
import { flowbiteTheme } from 'svelte-langgraph';

export const myCustomTheme = {
  ...flowbiteTheme,
  
  // Purple accent theme
  messageUser: "bg-purple-600 text-white p-4 rounded-xl ml-auto max-w-md mb-3",
  messageAssistant: "bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mr-auto max-w-md mb-3",
  sendButton: "bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded-lg",
  
  // Custom input styling
  inputField: "border-purple-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg p-3 flex-1",
  
  // Container customization
  container: "flex h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900",
};
```

Apply your theme:

```svelte
<!-- examples/dashboard/src/routes/+page.svelte -->
<script>
  import { LangGraphFrontend, ThemeProvider } from 'svelte-langgraph';
  import { myCustomTheme } from '$lib/custom-theme.js';
</script>

<ThemeProvider theme={myCustomTheme}>
  <LangGraphFrontend userId="tutorial-user" />
</ThemeProvider>
```

**Result**: Refresh the page to see your purple-themed chat interface!

### Step 6: Building a Custom Agent

Let's create a "Tutorial Assistant" agent specialized in helping with this tutorial.

Create the agent backend:

```python
# examples/langgraph-backend/src/svelte_langgraph/chains/tutorial_assistant.py
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from ..llm import get_llm

def create_tutorial_assistant_chain() -> Runnable:
    """Tutorial Assistant specialized in helping with Svelte LangGraph tutorials."""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a Tutorial Assistant specialized in helping users learn Svelte LangGraph.

Key areas you help with:
- SvelteKit and Svelte 5 syntax
- Flowbite UI component usage
- Socket.IO integration patterns
- LangGraph and LangChain concepts
- Deployment and production best practices

Always provide:
1. Clear, step-by-step instructions
2. Code examples with explanations
3. Links to relevant documentation
4. Common troubleshooting tips

Be encouraging and assume the user is learning."""),
        ("human", "{input}")
    ])
    
    llm = get_llm("openai")  # or "anthropic"
    return prompt | llm
```

Register the new agent:

```python
# examples/langgraph-backend/src/svelte_langgraph/app.py
from .chains.tutorial_assistant import create_tutorial_assistant_chain

# Add to your existing create_app function:
def create_app():
    # ... existing code ...
    
    # Add tutorial assistant
    tutorial_chain = create_tutorial_assistant_chain()
    app.add_routes(
        chain_router(
            tutorial_chain,
            path="/tutorial-assistant",
            input_type=dict,
            output_type=dict,
        )
    )
    
    return app
```

Update the frontend to show your new agent:

```typescript
// examples/dashboard/src/lib/stores/langgraph.ts
// Add to your endpoints array:
const endpoints = [
  // ... existing endpoints ...
  {
    id: 'tutorial-assistant',
    name: 'Tutorial Assistant',
    description: 'Specialized help for Svelte LangGraph tutorials',
    url: `${BACKEND_URL}/tutorial-assistant`,
    color: 'green'
  }
];
```

**Test it**: Restart your services and select "Tutorial Assistant" - ask it about Flowbite components!

### Step 7: Adding Custom Authentication

Let's add a simple user registration system.

Update the backend user model:

```python
# examples/langgraph-backend/src/svelte_langgraph/auth.py
# Add a registration endpoint:

@app.post("/register")
async def register(user_data: dict):
    username = user_data.get("username")
    password = user_data.get("password")
    email = user_data.get("email")
    
    # Simple validation
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    # Check if user exists (in production, use a real database)
    if username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash password and store user
    hashed_password = pwd_context.hash(password)
    users_db[username] = {
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow().isoformat()
    }
    
    return {"message": "User created successfully"}
```

Create a registration component:

```svelte
<!-- examples/dashboard/src/lib/components/Register.svelte -->
<script>
  import { Button, Card, Label, Input, Alert } from 'flowbite-svelte';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let username = '';
  let password = '';
  let email = '';
  let error = '';
  let loading = false;
  
  async function handleRegister() {
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      });
      
      if (response.ok) {
        dispatch('registered', { username });
      } else {
        const data = await response.json();
        error = data.detail || 'Registration failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<Card class="max-w-md mx-auto">
  <h2 class="text-2xl font-bold mb-4">Create Account</h2>
  
  {#if error}
    <Alert color="red" class="mb-4">{error}</Alert>
  {/if}
  
  <form on:submit|preventDefault={handleRegister} class="space-y-4">
    <div>
      <Label for="username">Username</Label>
      <Input id="username" bind:value={username} required />
    </div>
    
    <div>
      <Label for="email">Email</Label>
      <Input id="email" type="email" bind:value={email} />
    </div>
    
    <div>
      <Label for="password">Password</Label>
      <Input id="password" type="password" bind:value={password} required />
    </div>
    
    <Button type="submit" disabled={loading} class="w-full">
      {loading ? 'Creating Account...' : 'Register'}
    </Button>
  </form>
</Card>
```

**Result**: Users can now create accounts and have personalized chat sessions!

---

## Part 3: Production

### Step 8: Docker Deployment

Your application is ready for production! The included Docker setup handles everything:

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f
```

The Docker setup includes:
- **Nginx reverse proxy** (port 80)
- **SvelteKit frontend** (internal port 3000) 
- **FastAPI backend** (internal port 8000)
- **Automatic SSL** (with Let's Encrypt in production)

### Step 9: Environment Configuration

For production, update your `.env`:

```bash
# Production API keys
OPENAI_API_KEY=your-production-openai-key
ANTHROPIC_API_KEY=your-production-anthropic-key

# Strong JWT secret (generate with: openssl rand -hex 32)
SECRET_KEY=your-very-secure-production-secret-key

# Production settings
NODE_ENV=production
LOG_LEVEL=info
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database (optional - for user persistence)
DATABASE_URL=postgresql://user:pass@localhost:5432/svelte_langgraph
```

### Step 10: Monitoring and Health Checks

Monitor your application:

```bash
# Health check endpoints
curl http://localhost:8000/health
curl http://localhost:3000/api/health

# View real-time logs
docker-compose logs -f svelte-frontend
docker-compose logs -f langgraph-backend

# Monitor Socket.IO connections
# Check browser dev tools -> Network -> WS tab
```

Set up basic monitoring:

```typescript
// examples/dashboard/src/lib/monitoring.ts
export function trackEvent(event: string, data?: object) {
  if (typeof window !== 'undefined') {
    // Send to your analytics service
    console.log('Event:', event, data);
  }
}

// Track chat interactions
trackEvent('message_sent', { agent: 'chatbot', length: message.length });
trackEvent('response_received', { agent: 'chatbot', responseTime: Date.now() - startTime });
```

---

## 🎉 Congratulations!

You've successfully built a production-ready AI chat application with:

- ✅ **Multi-agent AI chat** with OpenAI and Anthropic
- ✅ **Beautiful Flowbite UI** with custom themes
- ✅ **Real-time Socket.IO** streaming
- ✅ **JWT authentication** with user registration
- ✅ **Custom AI agents** for specialized tasks
- ✅ **Docker deployment** ready for production

## 🚀 What's Next?

### Immediate Improvements
- **Add file uploads** for document chat
- **Implement conversation history** persistence
- **Add more AI agents** (image generation, code review)
- **Create admin dashboard** for user management

### Advanced Features
- **Multi-tenant support** for SaaS deployment
- **Rate limiting** and usage analytics
- **Voice chat integration** with speech-to-text
- **Custom model fine-tuning** for specialized domains

### Learning Resources
- 📖 **[Component Reference](../reference/components.md)** - All available Flowbite components
- 🎨 **[Advanced Theming](../guides/themes.md)** - Complex theme customizations
- 🔧 **[Architecture Deep Dive](../advanced/architecture.md)** - Understanding the internals
- 🚀 **[Performance Guide](../guides/performance.md)** - Scaling and optimization

## 💬 Get Help

- 🐛 **Found a bug?** [Report it here](https://github.com/synergyai-nl/svelte-langgraph/issues)
- 💡 **Have questions?** [Start a discussion](https://github.com/synergyai-nl/svelte-langgraph/discussions)
- 📖 **Need help?** Check our [troubleshooting guide](../advanced/troubleshooting.md)

## 🏆 Share Your Success

Built something cool? We'd love to see it! Share your project in our [showcase discussions](https://github.com/synergyai-nl/svelte-langgraph/discussions/categories/showcase).

---

**🎯 Tutorial completed!** You're now ready to build amazing AI applications with Svelte LangGraph and Flowbite.