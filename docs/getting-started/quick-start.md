# Quick Start Guide

Get your AI chat application running with Flowbite UI in under 5 minutes.

## 🎯 What You'll Build

A real-time AI chat interface with:
- Beautiful Flowbite components
- Multiple AI agents (ChatGPT, Claude, etc.)
- Dark/light mode support
- Socket.IO streaming responses

## 🚀 Option 1: Docker (Recommended)

The fastest way to get everything running:

```bash
# 1. Clone the repository
git clone https://github.com/synergyai-nl/svelte-langserve.git
cd svelte-langserve

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your API keys:
# OPENAI_API_KEY=your-key-here
# ANTHROPIC_API_KEY=your-key-here

# 3. Start all services
docker-compose up -d

# 4. Open your browser
open http://localhost:3000
```

**Demo credentials:** `demo` / `secret`

## 🛠 Option 2: Development Setup

For development and customization:

### Prerequisites

- Node.js 18+
- Python 3.11+
- pnpm (recommended)
- uv (for Python backend)

### Backend Setup

```bash
# 1. Start the LangServe backend
cd examples/langserve-backend

# 2. Install dependencies and run
uv run serve
# Backend runs on http://localhost:8000
```

### Frontend Setup

```bash
# 1. In a new terminal, start the frontend
cd examples/dashboard

# 2. Install dependencies
pnpm install

# 3. Generate internationalization files
pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide

# 4. Start development server
pnpm dev
# Frontend runs on http://localhost:5173
```

## 🎨 Flowbite Theme Demo

Visit these URLs to see the Flowbite integration:

- **Main Dashboard**: `http://localhost:5173`
- **Flowbite Theme**: `http://localhost:5173/flowbite`
- **Paraglide i18n**: `http://localhost:5173/demo/paraglide`

## 🔑 Required Environment Variables

Create a `.env` file with:

```bash
# Required API Keys
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional (for research agent)
TAVILY_API_KEY=your-tavily-api-key-here

# Authentication (change in production!)
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
```

## 🧪 Test Your Setup

### 1. Check Backend Health

```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### 2. Test Socket.IO Connection

Open browser dev tools and check for:
```
Socket.IO connected: true
Available endpoints: chatbot, code-assistant, data-analyst...
```

### 3. Send a Test Message

1. Log in with `demo` / `secret`
2. Select "General Chatbot" agent
3. Type: "Hello, can you help me?"
4. Watch for streaming response

## 🎨 Customizing the Flowbite Theme

Quick theme customization:

```svelte
<script>
  import { LangServeFrontend, ThemeProvider, flowbiteTheme } from 'svelte-langserve';
  
  const customTheme = {
    ...flowbiteTheme,
    messageUser: "bg-purple-600 text-white p-4 rounded-xl ml-auto max-w-md",
    sendButton: "bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded"
  };
</script>

<ThemeProvider theme={customTheme}>
  <LangServeFrontend userId="your-user-id" />
</ThemeProvider>
```

## 🆘 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.11+

# Install uv if missing
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clear cache and retry
cd examples/langserve-backend
uv cache clean
uv run serve
```

### Frontend Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
pnpm install

# Regenerate paraglide files
pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide
```

### Socket.IO Connection Failed
- Ensure backend is running on port 8000
- Check browser console for CORS errors
- Verify `.env` file is properly configured

### Missing API Keys
- Get OpenAI key: https://platform.openai.com/api-keys
- Get Anthropic key: https://console.anthropic.com/
- Restart services after adding keys

## ✨ What's Next?

- 📖 **[Complete Tutorial](./tutorial.md)** - Build a custom AI agent
- 🎨 **[Flowbite Theme Guide](../guides/themes.md)** - Advanced customization
- 🚀 **[Deployment Guide](../guides/deployment.md)** - Go to production
- 📋 **[Component Reference](../reference/components.md)** - Explore all components

## 💡 Pro Tips

1. **Use the Flowbite route** (`/flowbite`) to see all available components
2. **Enable dark mode** by clicking the theme toggle
3. **Try different agents** - each has specialized capabilities
4. **Check the network tab** to see Socket.IO messages in real-time
5. **Customize themes** without touching component code

---

**🎉 Congratulations!** You now have a fully functional AI chat application with beautiful Flowbite UI.

Ready to dive deeper? Start with our [step-by-step tutorial](./tutorial.md).