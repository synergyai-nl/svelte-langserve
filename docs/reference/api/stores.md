# Store API Reference

Complete reference for Svelte stores that manage state, Socket.IO connections, and real-time communication in Svelte LangServe.

## 📦 Store Exports

```typescript
import {
  // Main store
  langServeStore,
  
  // Derived stores
  connectionStore,
  conversationsStore,
  activeConversationStore,
  streamingStore,
  
  // Actions
  connectToServer,
  sendMessage,
  createConversation,
  joinConversation,
  
  // Types
  type LangServeState,
  type ConnectionStatus
} from 'svelte-langserve';
```

---

## 🏪 Main Store: `langServeStore`

The central store managing all LangServe state including Socket.IO connection, conversations, and streaming messages.

### State Interface

```typescript
interface LangServeState {
  // Connection state
  socket: Socket | null;
  connected: boolean;
  authenticated: boolean;
  connectionError: string | null;
  
  // Available endpoints and health
  availableEndpoints: LangServeEndpoint[];
  endpointHealth: Map<string, boolean>;
  
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Streaming state
  streamingMessages: Map<string, string>;
  
  // Pagination
  messagePagination: Map<string, {
    currentPage: number;
    messagesPerPage: number;
    totalMessages: number;
    hasMore: boolean;
  }>;
}
```

### Usage

```typescript
import { langServeStore } from 'svelte-langserve';

// Subscribe to full state
const unsubscribe = langServeStore.subscribe(state => {
  console.log('Connection status:', state.connected);
  console.log('Active conversation:', state.activeConversationId);
  console.log('Available endpoints:', state.availableEndpoints);
});

// Clean up subscription
onDestroy(unsubscribe);
```

### Actions

The store provides methods to update state and trigger side effects:

```typescript
// Get store instance with actions
const store = langServeStore;

// Connect to server
await store.connect('http://localhost:3000', 'user123', 'jwt-token');

// Send message
store.sendMessage('conv123', 'Hello!', ['chatbot']);

// Create conversation
const conversationId = await store.createConversation(['chatbot'], 'New Chat');

// Join existing conversation
await store.joinConversation('conv123');

// Disconnect
store.disconnect();
```

---

## 🔗 Derived Stores

### `connectionStore`

Reactive store for connection status and Socket.IO state.

```typescript
import { connectionStore } from 'svelte-langserve';

interface ConnectionState {
  connected: boolean;
  authenticated: boolean;
  socketId: string | null;
  error: string | null;
  reconnecting: boolean;
  connectionAttempts: number;
}

// Usage in components
$: connected = $connectionStore.connected;
$: error = $connectionStore.error;

// Reactive statements
$: if ($connectionStore.connected) {
  console.log('Connected with socket ID:', $connectionStore.socketId);
}
```

### `conversationsStore`

Manages conversation list with automatic sorting and filtering.

```typescript
import { conversationsStore } from 'svelte-langserve';

// Reactive conversation list (sorted by most recent)
$: conversations = $conversationsStore;

// Find specific conversation
$: currentConversation = conversations.find(c => c.id === activeId);

// Filter conversations
$: recentConversations = conversations.filter(c => 
  Date.now() - new Date(c.updatedAt).getTime() < 24 * 60 * 60 * 1000
);
```

### `activeConversationStore`

Current active conversation with messages and metadata.

```typescript
import { activeConversationStore } from 'svelte-langserve';

interface ActiveConversation {
  conversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  hasMore: boolean;
  pagination: {
    currentPage: number;
    totalMessages: number;
  };
}

// Usage
$: activeConv = $activeConversationStore;
$: messages = activeConv?.messages || [];
$: isLoading = activeConv?.isLoading || false;

// Load more messages (pagination)
function loadMoreMessages() {
  if (activeConv?.hasMore && !activeConv.isLoading) {
    langServeStore.loadMoreMessages();
  }
}
```

### `streamingStore`

Real-time streaming message state.

```typescript
import { streamingStore } from 'svelte-langserve';

interface StreamingState {
  activeStreams: Map<string, {
    messageId: string;
    content: string;
    agentId: string;
    startTime: number;
  }>;
  isAnyStreaming: boolean;
}

// Usage
$: streaming = $streamingStore;
$: isStreaming = streaming.isAnyStreaming;

// Get specific streaming message
$: streamingContent = streaming.activeStreams.get(messageId)?.content || '';
```

---

## 🚀 Store Actions

### Connection Management

#### `connectToServer(url, userId, authToken?)`

Establish Socket.IO connection to the server.

```typescript
import { connectToServer } from 'svelte-langserve';

try {
  await connectToServer(
    'http://localhost:3000',  // Server URL
    'user123',                // User ID
    'jwt-token-here'          // Optional auth token
  );
  console.log('Connected successfully');
} catch (error) {
  console.error('Connection failed:', error);
}
```

**Parameters:**
- `url: string` - Server WebSocket URL
- `userId: string` - Unique user identifier
- `authToken?: string` - JWT authentication token

**Returns:** `Promise<void>`

**Events triggered:**
- Updates `connectionStore` state
- Triggers `authenticate` Socket.IO event if token provided
- Loads user's conversation list

#### `disconnect()`

Disconnect from the server and clean up state.

```typescript
import { langServeStore } from 'svelte-langserve';

langServeStore.disconnect();

// State after disconnect:
// - socket: null
// - connected: false
// - streamingMessages: cleared
// - Cleanup timeouts cleared
```

### Message Operations

#### `sendMessage(conversationId, content, endpoints, metadata?)`

Send a message to AI agents in a conversation.

```typescript
import { sendMessage } from 'svelte-langserve';

sendMessage(
  'conv123',                    // Conversation ID
  'Explain quantum computing',  // Message content
  ['chatbot', 'code-assistant'], // Target agents
  {                            // Optional metadata
    temperature: 0.8,
    streaming: true,
    maxTokens: 500
  }
);
```

**Parameters:**
- `conversationId: string` - Target conversation
- `content: string` - Message content
- `endpoints: string[]` - Agent IDs to respond
- `metadata?: MessageMetadata` - AI configuration

**Metadata interface:**
```typescript
interface MessageMetadata {
  temperature?: number;     // 0.0-1.0, AI creativity
  streaming?: boolean;      // Enable streaming
  maxTokens?: number;       // Response length limit
  model?: string;          // Specific model
  systemPrompt?: string;   // Custom system prompt
}
```

**Side effects:**
- Adds user message to conversation
- Triggers Socket.IO `send_message` event
- Updates streaming state
- Handles response chunks automatically

#### `regenerateResponse(messageId, endpoints?)`

Request a new response for an existing message.

```typescript
import { langServeStore } from 'svelte-langserve';

langServeStore.regenerateResponse(
  'msg_456',              // Message ID to regenerate
  ['chatbot']             // Optional: specific agents
);
```

#### `stopGeneration(messageId)`

Stop ongoing AI response generation.

```typescript
import { langServeStore } from 'svelte-langserve';

langServeStore.stopGeneration('msg_456');
```

### Conversation Management

#### `createConversation(endpoints, title?, metadata?)`

Create a new conversation with specified agents.

```typescript
import { createConversation } from 'svelte-langserve';

const conversationId = await createConversation(
  ['chatbot', 'code-assistant'], // Agent IDs
  'My New Chat',                 // Optional title
  { project: 'web-app' }         // Optional metadata
);

console.log('Created conversation:', conversationId);
```

**Parameters:**
- `endpoints: string[]` - Agent IDs to include
- `title?: string` - Conversation title
- `metadata?: Record<string, unknown>` - Custom metadata

**Returns:** `Promise<string>` - New conversation ID

**Side effects:**
- Creates conversation on server
- Adds to local conversations list
- Automatically joins the conversation
- Sets as active conversation

#### `joinConversation(conversationId)`

Join an existing conversation.

```typescript
import { joinConversation } from 'svelte-langserve';

await joinConversation('conv123');

// After joining:
// - activeConversationId is set
// - Message history is loaded
// - Socket.IO room is joined
```

#### `deleteConversation(conversationId)`

Delete a conversation permanently.

```typescript
import { langServeStore } from 'svelte-langserve';

await langServeStore.deleteConversation('conv123');

// Side effects:
// - Conversation removed from server
// - Removed from local conversations list
// - If active, switches to another conversation
```

#### `loadMoreMessages(conversationId?, page?)`

Load additional message history (pagination).

```typescript
import { langServeStore } from 'svelte-langserve';

// Load next page for active conversation
langServeStore.loadMoreMessages();

// Load specific page for specific conversation
langServeStore.loadMoreMessages('conv123', 2);
```

### Configuration

#### `updateConversationConfig(conversationId, config)`

Update AI configuration for a conversation.

```typescript
import { langServeStore } from 'svelte-langserve';

langServeStore.updateConversationConfig('conv123', {
  temperature: 0.9,
  streaming: true,
  maxTokens: 1000,
  model: 'gpt-4'
});
```

#### `checkEndpointHealth(endpoints?)`

Check health status of AI endpoints.

```typescript
import { langServeStore } from 'svelte-langserve';

// Check all endpoints
langServeStore.checkEndpointHealth();

// Check specific endpoints
langServeStore.checkEndpointHealth(['chatbot', 'code-assistant']);

// Access health status
$: endpointHealth = $langServeStore.endpointHealth;
$: chatbotHealthy = endpointHealth.get('chatbot');
```

---

## 🔄 Reactive Patterns

### Auto-cleanup Streaming Messages

The store automatically cleans up streaming messages to prevent memory leaks:

```typescript
// Automatic cleanup after 30 seconds
const STREAMING_TIMEOUT = 30000;

// Manual cleanup
import { langServeStore } from 'svelte-langserve';

langServeStore.cleanupStreamingMessage('msg_123');
```

### Conversation Auto-sorting

Conversations are automatically sorted by most recent activity:

```typescript
// Always sorted by updatedAt (most recent first)
$: conversations = $conversationsStore;

// Most recent conversation
$: mostRecent = conversations[0];
```

### Message Deduplication

The store prevents duplicate messages and handles out-of-order chunks:

```typescript
// Messages are deduplicated by ID
// Streaming chunks are ordered by timestamp
// Final message replaces streaming content
```

---

## 🎯 Usage Patterns

### Component Integration

```svelte
<script>
  import { langServeStore, connectionStore, activeConversationStore } from 'svelte-langserve';
  import { onMount, onDestroy } from 'svelte';
  
  let message = '';
  
  // Reactive state
  $: connected = $connectionStore.connected;
  $: activeConv = $activeConversationStore;
  $: messages = activeConv?.messages || [];
  
  onMount(async () => {
    // Connect on component mount
    await langServeStore.connect('http://localhost:3000', 'user123');
  });
  
  function sendMessage() {
    if (message.trim() && activeConv?.conversation) {
      langServeStore.sendMessage(
        activeConv.conversation.id,
        message.trim(),
        ['chatbot']
      );
      message = '';
    }
  }
</script>

{#if connected}
  <div class="chat-interface">
    {#each messages as msg (msg.id)}
      <div class="message {msg.type}">
        {msg.content}
      </div>
    {/each}
    
    <input 
      bind:value={message} 
      on:keydown={(e) => e.key === 'Enter' && sendMessage()}
      placeholder="Type a message..."
    />
  </div>
{:else}
  <div>Connecting...</div>
{/if}
```

### Error Handling

```svelte
<script>
  import { connectionStore } from 'svelte-langserve';
  
  $: connectionError = $connectionStore.error;
  
  function retryConnection() {
    langServeStore.connect('http://localhost:3000', 'user123');
  }
</script>

{#if connectionError}
  <div class="error">
    Connection failed: {connectionError}
    <button on:click={retryConnection}>Retry</button>
  </div>
{/if}
```

### Pagination

```svelte
<script>
  import { activeConversationStore } from 'svelte-langserve';
  
  $: activeConv = $activeConversationStore;
  $: hasMore = activeConv?.hasMore || false;
  $: isLoading = activeConv?.isLoading || false;
  
  function loadMore() {
    if (hasMore && !isLoading) {
      langServeStore.loadMoreMessages();
    }
  }
</script>

<div class="message-list">
  {#if hasMore}
    <button on:click={loadMore} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Load more messages'}
    </button>
  {/if}
  
  {#each activeConv?.messages || [] as message (message.id)}
    <!-- Message display -->
  {/each}
</div>
```

---

## 🛠 Advanced Usage

### Custom Store Extensions

```typescript
import { langServeStore } from 'svelte-langserve';
import { derived } from 'svelte/store';

// Create custom derived stores
export const unreadConversations = derived(
  langServeStore,
  ($store) => $store.conversations.filter(c => c.hasUnread)
);

export const activeAgents = derived(
  langServeStore,
  ($store) => {
    const activeConv = $store.conversations.find(c => c.id === $store.activeConversationId);
    return activeConv?.participants.agents || [];
  }
);
```

### Store Middleware

```typescript
// Add logging middleware
const originalSendMessage = langServeStore.sendMessage;
langServeStore.sendMessage = (...args) => {
  console.log('Sending message:', args);
  return originalSendMessage.apply(langServeStore, args);
};
```

### Performance Optimization

```typescript
// Limit message history in memory
const MAX_MESSAGES_IN_MEMORY = 100;

// Custom message store with memory management
export const optimizedMessageStore = derived(
  activeConversationStore,
  ($activeConv) => {
    const messages = $activeConv?.messages || [];
    return messages.slice(-MAX_MESSAGES_IN_MEMORY);
  }
);
```

---

## 🐛 Debugging

### Store State Inspection

```typescript
import { langServeStore } from 'svelte-langserve';

// Debug current state
langServeStore.subscribe(state => {
  console.log('Store state:', {
    connected: state.connected,
    conversationCount: state.conversations.length,
    activeConversation: state.activeConversationId,
    streamingCount: state.streamingMessages.size
  });
});
```

### Socket.IO Events

```typescript
// Log all Socket.IO events
if (typeof window !== 'undefined') {
  const store = langServeStore;
  const socket = store.socket;
  
  if (socket) {
    // Log all events
    const originalEmit = socket.emit;
    socket.emit = (...args) => {
      console.log('Socket emit:', args[0], args.slice(1));
      return originalEmit.apply(socket, args);
    };
    
    // Log all listeners
    socket.onAny((event, ...args) => {
      console.log('Socket received:', event, args);
    });
  }
}
```

For more debugging tips, see the [Troubleshooting Guide](../advanced/troubleshooting.md).