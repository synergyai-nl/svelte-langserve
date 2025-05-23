# svelte-langserve

[![npm version](https://img.shields.io/npm/v/@svelte-langserve/core.svg)](https://npmjs.com/package/@svelte-langserve/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A collection of packages that make it easy to integrate Svelte applications with LangServe backends, providing real-time chat interfaces and AI assistant functionality.

## 📦 Packages

### Core Packages

- **[@svelte-langserve/core](./packages/@svelte-langserve/core)** - Core integration package with Socket.IO client and reactive stores
- **[@svelte-langserve/ui](./packages/@svelte-langserve/ui)** - Pre-built Svelte components for chat interfaces
- **[@svelte-langserve/types](./packages/@svelte-langserve/types)** - Shared TypeScript type definitions

### Development Tools

- **[@svelte-langserve/codegen](./packages/@svelte-langserve/codegen)** - Type generation tooling for TypeScript and Python

## 🚀 Quick Start

Install the packages you need:

```bash
npm install @svelte-langserve/core @svelte-langserve/ui
```

### Basic Setup

```svelte
<script>
  import { createLangServeStore } from '@svelte-langserve/core';
  import { LangServeFrontend } from '@svelte-langserve/ui';

  const langserve = createLangServeStore({
    socketUrl: 'http://localhost:3000',
    endpoints: [
      {
        id: 'chatbot',
        name: 'General Chat',
        url: 'http://localhost:8000/chatbot',
        type: 'chatbot'
      }
    ]
  });

  // Connect when component mounts
  langserve.connection.connect();
</script>

<LangServeFrontend {langserve} />
```

### Custom Implementation

For more control, use the individual components:

```svelte
<script>
  import { createLangServeStore } from '@svelte-langserve/core';
  import { ChatInterface, EndpointSelector } from '@svelte-langserve/ui';

  const langserve = createLangServeStore(config);
  let selectedEndpoint = 'chatbot';
</script>

<EndpointSelector 
  endpoints={langserve.client.getConfig().endpoints}
  bind:selected={selectedEndpoint}
/>

<ChatInterface 
  conversation={langserve.conversations.activeConversation}
  on:message={(e) => langserve.conversations.sendMessage(
    e.detail.content, 
    conversationId, 
    selectedEndpoint
  )}
/>
```

## 🏗 Examples

- **[Dashboard](./examples/dashboard)** - Complete chat interface with multiple AI assistants
- **[LangServe Backend](./examples/langserve-backend)** - Example Python backend with multiple AI agents

## 🛠 Development

This is a monorepo managed with pnpm workspaces.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Develop all packages (watch mode)
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

### Package Development

To work on individual packages:

```bash
# Work on core package
cd packages/@svelte-langserve/core
pnpm dev

# Work on UI components
cd packages/@svelte-langserve/ui
pnpm dev
```

## 📝 Type Generation

Generate shared types from JSON schemas:

```bash
# Install codegen globally
npm install -g @svelte-langserve/codegen

# Generate TypeScript types
svelte-langserve-codegen typescript schema.json -o types.ts

# Generate Python Pydantic models
svelte-langserve-codegen python schema.json -o models.py

# Generate both
svelte-langserve-codegen all schema.json --ts-output types.ts --py-output models.py
```

## 📖 Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/Streaming    ┌─────────────────┐
│   Svelte App    │ ◄─────────────► │   SvelteKit     │ ◄──────────────────► │   LangServe     │
│                 │                 │    Server       │                      │    Backend      │
└─────────────────┘                 └─────────────────┘                      └─────────────────┘
         │                                   │                                         │
         ▼                                   ▼                                         ▼
┌─────────────────┐                 ┌─────────────────┐                      ┌─────────────────┐
│ @svelte-        │                 │    Socket.IO    │                      │   AI Models     │
│ langserve/core  │                 │     Server      │                      │   (GPT, Claude) │
│ @svelte-        │                 └─────────────────┘                      └─────────────────┘
│ langserve/ui    │
└─────────────────┘
```

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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [svelte-langserve contributors](LICENSE)