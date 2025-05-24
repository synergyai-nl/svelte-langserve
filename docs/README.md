# Svelte LangServe Documentation

Welcome to the comprehensive documentation for Svelte LangServe - a complete solution for building real-time AI chat applications with SvelteKit, LangServe, and beautiful Flowbite UI components.

## 🎨 What Makes This Special

- **🤖 Real-time AI Chat** - WebSocket-powered streaming responses from multiple AI models
- **🎨 Flowbite Integration** - Professional UI components with dark mode support
- **⚡ Modern Stack** - SvelteKit + Tailwind CSS v4 + TypeScript + Socket.IO
- **🔧 Production Ready** - Docker deployment, authentication, and monitoring

## 📚 Documentation Structure

### 🚀 [Getting Started](./getting-started/)
- **[Quick Start](./getting-started/quick-start.md)** - Get up and running in 5 minutes
- **[Tutorial](./getting-started/tutorial.md)** - Build your first AI chat app step-by-step
- **[Examples](./getting-started/examples/)** - Integration examples and live demos

### 📖 [Guides](./guides/)
- **[Flowbite Theme System](./guides/themes.md)** - Complete theming guide with Flowbite
- **[Authentication](./guides/authentication.md)** - JWT security and user management
- **[Internationalization](./guides/internationalization.md)** - Multi-language support with Paraglide
- **[Deployment](./guides/deployment.md)** - Docker production deployment
- **[Performance](./guides/performance.md)** - Optimization and best practices

### 📋 [Reference](./reference/)
- **[API Reference](./reference/api/)** - Complete API documentation
- **[Flowbite Components](./reference/components.md)** - LangServe + Flowbite component library
- **[Stores & State](./reference/stores.md)** - Socket.IO stores and reactive state
- **[Socket Events](./reference/socket-events.md)** - Real-time event reference

### 🔧 [Advanced](./advanced/)
- **[Architecture](./advanced/architecture.md)** - System design and data flow
- **[Custom AI Agents](./advanced/custom-agents.md)** - Building specialized agents
- **[Troubleshooting](./advanced/troubleshooting.md)** - Common issues and solutions

### 🤝 [Contributing](./contributing/)
- **[Development Setup](./contributing/development.md)** - Environment and tooling
- **[Testing Guide](./contributing/testing.md)** - Unit, integration, and E2E tests
- **[Release Process](./contributing/releases.md)** - Versioning and publishing

## 🎯 Popular Use Cases

| I want to... | Start here... |
|-------------|---------------|
| **Build a ChatGPT-like interface** | [Quick Start](./getting-started/quick-start.md) → [Tutorial](./getting-started/tutorial.md) |
| **Customize Flowbite components** | [Flowbite Theme Guide](./guides/themes.md) |
| **Deploy to production** | [Deployment Guide](./guides/deployment.md) |
| **Add custom AI agents** | [Custom Agents](./advanced/custom-agents.md) |
| **Integrate with existing app** | [API Reference](./reference/api/) |

## 🎨 Flowbite Theme Highlights

Our Flowbite integration provides:

- **50+ Pre-built Components** - Buttons, cards, modals, forms, and more
- **Dark/Light Mode** - Automatic theme switching with user preference
- **Responsive Design** - Mobile-first components that work everywhere
- **Accessibility** - WCAG compliant components out of the box
- **Icon Library** - 400+ Flowbite icons ready to use

```svelte
<!-- Beautiful AI chat with one component -->
<script>
  import { LangServeFrontend } from 'svelte-langserve';
</script>

<LangServeFrontend 
  userId="user123" 
  theme="flowbite" 
  darkMode={true} 
/>
```

## 🚀 Quick Demo

Experience the Flowbite theme in action:

```bash
# Clone and run
git clone <repository-url>
cd svelte-langserve/examples/dashboard
pnpm install && pnpm dev

# Visit http://localhost:5173/flowbite
```

## 🆘 Need Help?

- 📖 [Troubleshooting Guide](./advanced/troubleshooting.md) - Common issues and fixes
- 💡 [Examples Gallery](./getting-started/examples/) - Live code examples
- 🐛 [Report Issues](https://github.com/synergyai-nl/svelte-langserve/issues)
- 💬 [Discussions](https://github.com/synergyai-nl/svelte-langserve/discussions)

---

**Ready to build beautiful AI applications?** Start with our [5-minute Quick Start](./getting-started/quick-start.md)!