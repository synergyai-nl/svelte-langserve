# LangServe Frontend in SvelteKit

This is a Svelte implementation of the LangServe Socket.IO Frontend. It provides a fully-featured chat interface for interacting with LangServe endpoints via Socket.IO.

## Features

- Real-time communication with LangServe endpoints via Socket.IO
- Support for multiple LangServe endpoints
- Message streaming
- Conversation management
- Endpoint health checking and testing
- Configuration options (temperature, streaming, etc.)
- Responsive UI using TailwindCSS

## Components

- `LangServeFrontend`: The main component that wraps all functionality
- `EndpointSelector`: Component for selecting LangServe endpoints
- `ConfigPanel`: Component for configuring LangServe parameters
- `ConversationList`: Component for displaying and selecting conversations
- `ChatInterface`: Component for the chat display and input
- `ChatMessage`: Component for rendering individual messages

## Store

The `langserveStore` is a Svelte store that manages all state and communication with the Socket.IO server. It provides methods for:

- Connecting/disconnecting
- Creating conversations
- Sending messages
- Testing endpoints
- Loading conversations
- etc.

## Server Implementation

The server implementation is in `hooks.server.ts` and sets up a Socket.IO server with LangServe integration. It:

1. Initializes on the first request
2. Sets up Socket.IO event handlers
3. Manages conversations
4. Connects to LangServe endpoints using LangChain's `RemoteRunnable`
5. Handles streaming and non-streaming responses

## Usage

```svelte
<script>
  import { LangServeFrontend } from '$lib/langserve';
</script>

<LangServeFrontend 
  userId="user_123"
  serverUrl="http://localhost:3000"
/>
```

## Environment Variables

- `VITE_LANGSERVE_SERVER_URL`: The URL of the Socket.IO server (defaults to http://localhost:3000)
- `LANGSERVE_CHATBOT_URL`: URL of the general chatbot LangServe endpoint
- `LANGSERVE_CODE_URL`: URL of the code assistant LangServe endpoint
- `LANGSERVE_DATA_URL`: URL of the data analyst LangServe endpoint
- `LANGSERVE_API_KEY`: Optional API key for LangServe endpoints

## Development

To run the development server:

```bash
cd frontend
pnpm install
pnpm dev
```

The LangServe frontend will be available at http://localhost:5173/