// Type definitions for LangServe Socket.IO Frontend

export interface LangServeEndpoint {
  id: string;
  name: string;
  url: string;
  description?: string;
  config_schema?: any;
  input_schema?: any;
  output_schema?: any;
  healthy?: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'human' | 'ai' | 'system' | 'tool';
  content: string | any[];
  sender_id: string;
  sender_type: 'user' | 'agent';
  timestamp: string;
  conversation_id: string;
  additional_kwargs?: Record<string, any>;
}

export interface Conversation {
  id: string;
  participants: {
    users: string[];
    agents: LangServeEndpoint[];
  };
  messages: ChatMessage[];
  status: 'active' | 'paused' | 'ended';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface MessageChunk {
  message_id: string;
  chunk_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  conversation_id: string;
}