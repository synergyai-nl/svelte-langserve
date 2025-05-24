# Component Library Reference

Complete reference for all Svelte LangServe components with Flowbite integration. Each component is designed to work seamlessly with the theme system and provides excellent TypeScript support.

## 🎨 Quick Start

```svelte
<script>
  import { LangServeFrontend, ThemeProvider, flowbiteTheme } from 'svelte-langserve';
</script>

<ThemeProvider theme={flowbiteTheme}>
  <LangServeFrontend userId="your-user-id" />
</ThemeProvider>
```

## 📦 Core Components

### LangServeFrontend

The main component that provides a complete AI chat interface with Flowbite styling.

```svelte
<LangServeFrontend 
  userId="user123"
  authToken="jwt-token-here"
  serverUrl="http://localhost:3000"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | `string` | **required** | Unique identifier for the user session |
| `authToken` | `string?` | `undefined` | JWT token for authenticated requests |
| `serverUrl` | `string` | `'http://localhost:3000'` | Backend server URL for Socket.IO connection |

#### Features

- ✅ **Real-time messaging** with Socket.IO
- ✅ **Multi-agent support** - Switch between different AI agents
- ✅ **Conversation management** - Create, delete, and switch conversations
- ✅ **Flowbite theming** - Automatic integration with theme system
- ✅ **Responsive design** - Works on desktop and mobile
- ✅ **Dark mode support** - Automatic dark/light theme switching

#### Usage Examples

**Basic Usage:**
```svelte
<LangServeFrontend userId="demo-user" />
```

**With Authentication:**
```svelte
<script>
  import { LangServeFrontend } from 'svelte-langserve';
  
  let authToken = localStorage.getItem('auth_token');
</script>

<LangServeFrontend 
  userId="authenticated-user"
  {authToken}
  serverUrl="https://your-production-api.com"
/>
```

**Custom Server:**
```svelte
<LangServeFrontend 
  userId="user123"
  serverUrl="https://api.yourcompany.com"
/>
```

---

### ThemeProvider

Provides theme context to all child components. Supports Flowbite themes, custom themes, and runtime overrides.

```svelte
<ThemeProvider theme={flowbiteTheme} variant="dark" override={customOverride}>
  <LangServeFrontend userId="user123" />
</ThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `ChatTheme` | `defaultTheme` | Base theme object with CSS classes |
| `config` | `ThemeConfig` | `defaultThemeConfig` | Theme configuration settings |
| `variant` | `'primary' \| 'dark' \| 'compact' \| 'mobile'` | `undefined` | Theme variant for different use cases |
| `override` | `ThemeOverride` | `undefined` | Runtime theme property overrides |
| `children` | `Snippet` | **required** | Child components to provide theme to |

#### Available Themes

```typescript
import { 
  defaultTheme,      // Clean Tailwind CSS theme
  flowbiteTheme,     // Professional Flowbite theme
  createFlowbiteTheme // Factory for Flowbite variants
} from 'svelte-langserve';

// Create custom Flowbite variants
const darkTheme = createFlowbiteTheme('dark');
const compactTheme = createFlowbiteTheme('compact');
```

#### Theme Structure

```typescript
interface ChatTheme {
  // Main containers
  container: string;
  sidebar: string;
  chatArea: string;
  
  // Messages
  messageContainer: string;
  messageUser: string;
  messageAssistant: string;
  messageSystem: string;
  
  // Input area
  inputContainer: string;
  inputField: string;
  sendButton: string;
  sendButtonDisabled: string;
  
  // Components
  endpointSelector: string;
  configPanel: string;
  conversationList: string;
  
  // States
  loading: string;
  error: string;
  success: string;
  // ... 50+ more properties
}
```

#### Usage Examples

**Default Theme:**
```svelte
<!-- Uses defaultTheme automatically -->
<LangServeFrontend userId="user123" />
```

**Flowbite Theme:**
```svelte
<script>
  import { ThemeProvider, flowbiteTheme } from 'svelte-langserve';
</script>

<ThemeProvider theme={flowbiteTheme}>
  <LangServeFrontend userId="user123" />
</ThemeProvider>
```

**Custom Theme:**
```svelte
<script>
  import { ThemeProvider, defaultTheme } from 'svelte-langserve';
  
  const customTheme = {
    ...defaultTheme,
    messageUser: "bg-purple-600 text-white p-4 rounded-xl ml-auto max-w-md",
    sendButton: "bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded"
  };
</script>

<ThemeProvider theme={customTheme}>
  <LangServeFrontend userId="user123" />
</ThemeProvider>
```

**Runtime Theme Override:**
```svelte
<script>
  import { ThemeProvider, flowbiteTheme } from 'svelte-langserve';
  
  let accentColor = 'blue';
  
  $: themeOverride = {
    messageUser: `bg-${accentColor}-600 text-white p-4 rounded-lg`,
    sendButton: `bg-${accentColor}-600 hover:bg-${accentColor}-700 text-white py-2 px-4 rounded`
  };
</script>

<select bind:value={accentColor}>
  <option value="blue">Blue</option>
  <option value="purple">Purple</option>
  <option value="green">Green</option>
</select>

<ThemeProvider theme={flowbiteTheme} override={themeOverride}>
  <LangServeFrontend userId="user123" />
</ThemeProvider>
```

---

### ChatInterface

The main chat area component with message display and input handling.

```svelte
<ChatInterface 
  {sendMessage}
  {conversation}
  {isLoading}
  oncreate={handleCreate}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sendMessage` | `(content: string) => void` | **required** | Function to send a new message |
| `conversation` | `Conversation \| null` | `null` | Current conversation object with messages |
| `isLoading` | `boolean` | `false` | Whether a message is currently being sent |
| `oncreate` | `(() => void)?` | `undefined` | Callback when create conversation is clicked |

#### Features

- ✅ **Message display** with user/assistant styling
- ✅ **Auto-scrolling** to latest messages
- ✅ **Keyboard shortcuts** (Enter to send, Shift+Enter for new line)
- ✅ **Loading states** with visual feedback
- ✅ **Message timestamps** and status indicators
- ✅ **Flowbite input styling** with proper focus states

#### Events

```typescript
// Dispatched when user sends a message
dispatch('message', { content: string, timestamp: number });

// Dispatched when create conversation button is clicked
dispatch('create');
```

#### Usage Examples

**Basic Chat:**
```svelte
<script>
  import { ChatInterface } from 'svelte-langserve';
  
  let conversation = { 
    id: '1', 
    title: 'Chat', 
    messages: [
      { id: '1', content: 'Hello!', role: 'user', timestamp: Date.now() },
      { id: '2', content: 'Hi there!', role: 'assistant', timestamp: Date.now() }
    ]
  };
  
  function sendMessage(content) {
    // Handle message sending
    console.log('Sending:', content);
  }
</script>

<ChatInterface {sendMessage} {conversation} />
```

**With Loading State:**
```svelte
<script>
  let isLoading = false;
  
  async function sendMessage(content) {
    isLoading = true;
    try {
      await api.sendMessage(content);
    } finally {
      isLoading = false;
    }
  }
</script>

<ChatInterface {sendMessage} {conversation} {isLoading} />
```

---

### ChatMessage

Individual message component with proper styling for different message types.

```svelte
<ChatMessage 
  message={messageObject}
  showTimestamp={true}
  showAvatar={true}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `ChatMessage` | **required** | Message object with content, role, etc. |
| `showTimestamp` | `boolean` | `true` | Whether to display message timestamp |
| `showAvatar` | `boolean` | `true` | Whether to show user/assistant avatar |
| `maxWidth` | `string` | `'max-w-md'` | Maximum width class for message bubble |

#### Message Types

```typescript
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  metadata?: {
    agent?: string;
    model?: string;
    tokens?: number;
  };
}
```

#### Features

- ✅ **Role-based styling** - Different colors for user/assistant/system
- ✅ **Markdown support** - Rich text formatting in messages
- ✅ **Timestamp display** - Formatted relative timestamps
- ✅ **Avatar integration** - User and AI assistant avatars
- ✅ **Flowbite styling** - Consistent with design system

#### Usage Examples

**Basic Message:**
```svelte
<script>
  import { ChatMessage } from 'svelte-langserve';
  
  const message = {
    id: '1',
    content: 'Hello, how can I help you today?',
    role: 'assistant',
    timestamp: Date.now()
  };
</script>

<ChatMessage {message} />
```

**Custom Styling:**
```svelte
<ChatMessage 
  {message} 
  showTimestamp={false}
  showAvatar={false}
  maxWidth="max-w-lg"
/>
```

---

### EndpointSelector

Multi-select component for choosing AI agents/endpoints.

```svelte
<EndpointSelector 
  {endpoints}
  {selectedEndpoints}
  onchange={handleSelectionChange}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `endpoints` | `LangServeEndpoint[]` | **required** | Available AI endpoints/agents |
| `selectedEndpoints` | `string[]` | `[]` | Currently selected endpoint IDs |
| `onchange` | `(selected: string[]) => void` | **required** | Callback when selection changes |
| `multiple` | `boolean` | `true` | Allow multiple endpoint selection |

#### Endpoint Structure

```typescript
interface LangServeEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'chatbot' | 'code-assistant' | 'data-analyst' | 'creative-writer' | 'research-assistant';
  description?: string;
  icon?: string;
  color?: string;
}
```

#### Features

- ✅ **Multi-select support** - Choose multiple AI agents
- ✅ **Search/filter** - Find endpoints quickly
- ✅ **Visual indicators** - Icons and colors for different agent types
- ✅ **Flowbite styling** - Consistent dropdown and checkbox styling
- ✅ **Keyboard navigation** - Full accessibility support

#### Usage Examples

**Basic Selector:**
```svelte
<script>
  import { EndpointSelector } from 'svelte-langserve';
  
  const endpoints = [
    { id: 'chatbot', name: 'General Chatbot', url: '...', type: 'chatbot' },
    { id: 'code', name: 'Code Assistant', url: '...', type: 'code-assistant' }
  ];
  
  let selectedEndpoints = ['chatbot'];
  
  function handleSelectionChange(selected) {
    selectedEndpoints = selected;
    console.log('Selected:', selected);
  }
</script>

<EndpointSelector {endpoints} {selectedEndpoints} onchange={handleSelectionChange} />
```

**Single Selection:**
```svelte
<EndpointSelector 
  {endpoints} 
  {selectedEndpoints} 
  onchange={handleSelectionChange}
  multiple={false}
/>
```

---

### ConversationList

Sidebar component showing conversation history with create/delete functionality.

```svelte
<ConversationList 
  {conversations}
  {activeConversationId}
  oncreate={handleCreate}
  onselect={handleSelect}
  ondelete={handleDelete}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `conversations` | `Conversation[]` | **required** | List of conversation objects |
| `activeConversationId` | `string \| null` | `null` | ID of currently active conversation |
| `oncreate` | `() => void` | **required** | Callback to create new conversation |
| `onselect` | `(id: string) => void` | **required** | Callback when conversation is selected |
| `ondelete` | `(id: string) => void` | **required** | Callback to delete conversation |

#### Conversation Structure

```typescript
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  endpoints: string[];
}
```

#### Features

- ✅ **Conversation management** - Create, select, delete conversations
- ✅ **Visual hierarchy** - Clear active/inactive states
- ✅ **Recent first** - Automatic sorting by last activity
- ✅ **Flowbite styling** - Consistent sidebar and button styling
- ✅ **Context menus** - Right-click actions for power users

#### Usage Examples

**Basic List:**
```svelte
<script>
  import { ConversationList } from 'svelte-langserve';
  
  let conversations = [
    { id: '1', title: 'General Chat', messages: [], createdAt: Date.now() },
    { id: '2', title: 'Code Help', messages: [], createdAt: Date.now() }
  ];
  
  let activeConversationId = '1';
  
  function handleCreate() {
    const newConv = { 
      id: Date.now().toString(), 
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now()
    };
    conversations = [...conversations, newConv];
    activeConversationId = newConv.id;
  }
  
  function handleSelect(id) {
    activeConversationId = id;
  }
  
  function handleDelete(id) {
    conversations = conversations.filter(c => c.id !== id);
    if (activeConversationId === id) {
      activeConversationId = conversations[0]?.id || null;
    }
  }
</script>

<ConversationList 
  {conversations}
  {activeConversationId}
  oncreate={handleCreate}
  onselect={handleSelect}
  ondelete={handleDelete}
/>
```

---

### ConfigPanel

Configuration panel for adjusting AI response settings.

```svelte
<ConfigPanel 
  {config}
  onchange={handleConfigChange}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `ChatConfig` | **required** | Current configuration object |
| `onchange` | `(config: ChatConfig) => void` | **required** | Callback when config changes |

#### Configuration Structure

```typescript
interface ChatConfig {
  temperature: number;        // 0.0 - 1.0, creativity level
  streaming: boolean;         // Enable streaming responses
  maxTokens?: number;         // Maximum response length
  model?: string;             // Specific model to use
  systemPrompt?: string;      // Custom system prompt
}
```

#### Features

- ✅ **Temperature slider** - Adjust AI creativity (0.0 = focused, 1.0 = creative)
- ✅ **Streaming toggle** - Enable/disable real-time responses
- ✅ **Model selection** - Choose specific AI models when available
- ✅ **Token limit** - Control response length
- ✅ **Flowbite controls** - Consistent form styling

#### Usage Examples

**Basic Config:**
```svelte
<script>
  import { ConfigPanel } from 'svelte-langserve';
  
  let config = {
    temperature: 0.7,
    streaming: true,
    maxTokens: 1000
  };
  
  function handleConfigChange(newConfig) {
    config = newConfig;
    console.log('Config updated:', config);
  }
</script>

<ConfigPanel {config} onchange={handleConfigChange} />
```

## 🎨 Theming Integration

All components automatically integrate with the theme system:

```svelte
<script>
  import { 
    LangServeFrontend, 
    ThemeProvider, 
    flowbiteTheme,
    ChatInterface,
    ChatMessage 
  } from 'svelte-langserve';
</script>

<!-- All components inherit the Flowbite theme -->
<ThemeProvider theme={flowbiteTheme}>
  <LangServeFrontend userId="user123" />
  
  <!-- Or use individual components -->
  <ChatInterface sendMessage={handleSend} {conversation} />
  <ChatMessage {message} />
</ThemeProvider>
```

## 🔧 TypeScript Support

All components are fully typed with TypeScript:

```typescript
import type { 
  ChatTheme, 
  Conversation, 
  ChatMessage, 
  LangServeEndpoint,
  ChatConfig 
} from 'svelte-langserve';

// Full type safety for all props and events
const handleMessage = (event: CustomEvent<{ content: string }>) => {
  // TypeScript knows the event structure
};
```

## 🚀 Performance Features

- **Lazy loading** - Components load only when needed
- **Virtual scrolling** - Efficient handling of long message histories
- **Debounced updates** - Smooth typing and configuration changes
- **Memory management** - Automatic cleanup of old conversations
- **Optimized re-renders** - Smart Svelte reactivity patterns

## 📱 Responsive Design

All components work seamlessly across devices:

- **Desktop** - Full featured experience with sidebars and panels
- **Tablet** - Adaptive layout with collapsible sidebars
- **Mobile** - Touch-optimized interface with bottom navigation
- **Accessibility** - Full WCAG compliance with keyboard navigation

## 🔗 Integration Examples

See the [Examples Directory](../getting-started/examples/) for:

- **Basic chat app** - Minimal implementation
- **Multi-agent dashboard** - Full-featured application
- **Custom themes** - Branding and styling examples
- **Production setup** - Authentication and deployment

## 🆘 Troubleshooting

Common component issues and solutions:

### Component Not Rendering

```svelte
<!-- ❌ Missing ThemeProvider -->
<LangServeFrontend userId="user123" />

<!-- ✅ Wrap with ThemeProvider -->
<ThemeProvider>
  <LangServeFrontend userId="user123" />
</ThemeProvider>
```

### Theme Not Applied

```svelte
<!-- ❌ Theme not passed down -->
<div>
  <ThemeProvider theme={flowbiteTheme}>
    <span>Themed content</span>
  </ThemeProvider>
  <LangServeFrontend userId="user123" /> <!-- No theme -->
</div>

<!-- ✅ Theme wraps all components -->
<ThemeProvider theme={flowbiteTheme}>
  <div>
    <span>Themed content</span>
    <LangServeFrontend userId="user123" />
  </div>
</ThemeProvider>
```

### TypeScript Errors

```typescript
// ❌ Missing type imports
import { LangServeFrontend } from 'svelte-langserve';

// ✅ Import types explicitly
import { LangServeFrontend, type ChatTheme } from 'svelte-langserve';
```

For more troubleshooting, see the [Troubleshooting Guide](../advanced/troubleshooting.md).