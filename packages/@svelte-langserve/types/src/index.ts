// Core message types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  conversationId: string;
  metadata?: Record<string, unknown>;
}

// Conversation types
export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

// LangServe endpoint configuration
export interface LangServeEndpoint {
  id: string;
  name: string;
  url: string;
  description?: string;
  type: 'chatbot' | 'code-assistant' | 'data-analyst' | 'creative-writer' | 'research-assistant';
  config?: Record<string, unknown>;
}

// Streaming response types
export interface StreamingResponse {
  type: 'token' | 'complete' | 'error';
  content: string;
  messageId: string;
  conversationId: string;
  metadata?: Record<string, unknown>;
}

// Socket.IO event types
export interface SocketEvents {
  // Client to server
  'message:send': (data: { content: string; conversationId: string; endpointId: string }) => void;
  'conversation:create': (data: { endpointId: string; title?: string }) => void;
  'conversation:join': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;

  // Server to client
  'message:received': (message: Message) => void;
  'message:streaming': (data: StreamingResponse) => void;
  'conversation:created': (conversation: Conversation) => void;
  'conversation:updated': (conversation: Conversation) => void;
  'error': (error: { message: string; code?: string }) => void;
}

// Configuration types
export interface LangServeConfig {
  endpoints: LangServeEndpoint[];
  socketUrl: string;
  defaultEndpoint?: string;
}

// Error types
export interface LangServeError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}