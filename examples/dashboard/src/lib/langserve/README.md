# LangGraph Frontend in SvelteKit

This is a Svelte implementation of the LangGraph Socket.IO Frontend. It provides a fully-featured chat interface for interacting with LangGraph assistants via Socket.IO.

## Features

- Real-time communication with LangGraph assistants via Socket.IO
- Support for multiple LangGraph assistants
- Message streaming
- Conversation management
- Assistant health checking and testing
- Configuration options (temperature, streaming, etc.)
- Responsive UI using TailwindCSS

## Components

- `LangGraphFrontend`: The main component that wraps all functionality
- `EndpointSelector`: Component for selecting LangGraph assistants
- `ConfigPanel`: Component for configuring LangGraph parameters
- `ConversationList`: Component for displaying and selecting conversations
- `ChatInterface`: Component for the chat display and input
- `ChatMessage`: Component for rendering individual messages

## Store

The `langgraphStore` is a Svelte store that manages all state and communication with the Socket.IO server. It provides methods for:

- Connecting/disconnecting
- Creating conversations
- Sending messages
- Testing assistants
- Loading conversations
- etc.

## Server Implementation

The server implementation is in `hooks.server.ts` and sets up a Socket.IO server with LangGraph integration. It:

1. Initializes on the first request
2. Sets up Socket.IO event handlers
3. Manages conversations
4. Connects to LangGraph assistants using LangChain's `RemoteGraph`
5. Handles streaming and non-streaming responses

## Usage

```svelte
<script>
	import { LangGraphFrontend } from '$lib/langserve';
</script>

<LangGraphFrontend userId="user_123" serverUrl="http://localhost:3000" />
```

## Environment Variables

- `VITE_LANGGRAPH_SERVER_URL`: The URL of the Socket.IO server (defaults to http://localhost:3000)
- `LANGGRAPH_CHATBOT_URL`: URL of the general chatbot LangGraph assistant
- `LANGGRAPH_CODE_URL`: URL of the code assistant LangGraph assistant
- `LANGGRAPH_DATA_URL`: URL of the data analyst LangGraph assistant
- `LANGGRAPH_API_KEY`: Optional API key for LangGraph assistants

## Development

To run the development server:

```bash
cd frontend
pnpm install
pnpm dev
```

The LangGraph frontend will be available at http://localhost:5173/
