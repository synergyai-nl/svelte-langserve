// Re-export LangChain types as primary types for 1:1 backend mapping
export type { 
  BaseMessage, 
  HumanMessage, 
  AIMessage, 
  SystemMessage 
} from '@langchain/core/messages';
export type { RunnableConfig } from '@langchain/core/runnables';

// Extend LangChain types for Socket.IO specific needs
import type { BaseMessage, RunnableConfig } from '@langchain/core/messages';

export interface LangServeEndpoint {
  id: string;
  name: string;
  url: string;
  description?: string;
  type: 'chatbot' | 'code-assistant' | 'data-analyst' | 'creative-writer' | 'research-assistant';
  config?: RunnableConfig;
}

export interface Conversation {
  id: string;
  title?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  participants: {
    users: string[];
    agents: LangServeEndpoint[];
  };
  status: 'active' | 'completed' | 'error';
  metadata?: Record<string, unknown>;
}

// Socket.IO enhanced message type that wraps LangChain BaseMessage
export interface ChatMessage {
  id: string;
  type: 'human' | 'ai' | 'system';
  content: string | Record<string, unknown>;
  sender_id: string;
  sender_type: 'user' | 'agent';
  timestamp: string;
  conversation_id: string;
  additional_kwargs?: Record<string, unknown>;
}

// For new implementations, we'll gradually migrate to use BaseMessage directly
export interface LangChainMessage {
  id: string;
  message: BaseMessage;  // Direct LangChain type
  sender_id: string;
  sender_type: 'user' | 'agent';
  timestamp: string;
  conversation_id: string;
  config?: RunnableConfig;
}

// Socket.IO event types
export interface SocketEvents {
  // Client to server
  'authenticate': (data: { user_id: string; token?: string }) => void;
  'create_conversation': (data: { 
    endpoint_ids: string[]; 
    initial_message?: string; 
    config?: RunnableConfig;
  }) => void;
  'send_message': (data: { 
    conversation_id: string; 
    content: string; 
    config?: RunnableConfig;
  }) => void;
  'test_endpoint': (data: { endpoint_id: string }) => void;
  'get_endpoint_schemas': (data: { endpoint_id: string }) => void;
  'join_conversation': (data: { conversation_id: string }) => void;
  'list_conversations': () => void;
  'get_conversation_history': (data: { conversation_id: string }) => void;
  
  // Server to client  
  'authenticated': (data: { user_id: string; available_endpoints: LangServeEndpoint[] }) => void;
  'message_received': (message: ChatMessage) => void;
  'message_chunk': (chunk: MessageChunk) => void;
  'conversation_created': (conversation: Conversation) => void;
  'conversation_joined': (conversation: Conversation) => void;
  'conversations_list': (conversations: Conversation[]) => void;
  'conversation_history': (data: { conversation_id: string; messages: ChatMessage[] }) => void;
  'agent_response_start': (data: { 
    message_id: string; 
    endpoint_id: string; 
    endpoint_name: string;
    conversation_id: string;
  }) => void;
  'agent_response_complete': (message: ChatMessage) => void;
  'agent_response_error': (data: { 
    message_id: string; 
    endpoint_id: string; 
    error: string;
  }) => void;
  'endpoint_schemas': (data: { endpoint_id: string; schemas: unknown }) => void;
  'endpoint_test_result': (data: { 
    endpoint_id: string; 
    healthy: boolean; 
    error?: string;
  }) => void;
  'error': (error: { message: string }) => void;
  'agent_error': (error: { 
    endpoint_id: string; 
    endpoint_name: string; 
    error: string;
    conversation_id: string;
  }) => void;
}

export interface MessageChunk {
  message_id: string;
  chunk_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  conversation_id: string;
}

export interface LangServeConfig {
  endpoints: LangServeEndpoint[];
  socketUrl: string;
  defaultEndpoint?: string;
  streamingConfig?: {
    timeout: number;
    maxConcurrent: number;
    cleanupInterval: number;
  };
}

// Authentication types
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  roles?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Error types
export interface LangServeError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}