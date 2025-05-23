// Type definitions for LangServe Socket.IO Frontend

export interface LangServeEndpoint {
	id: string;
	name: string;
	url: string;
	description?: string;
	config_schema?: Record<string, unknown>;
	input_schema?: Record<string, unknown>;
	output_schema?: Record<string, unknown>;
	healthy?: boolean;
}

export interface ChatMessage {
	id: string;
	type: 'human' | 'ai' | 'system' | 'tool';
	content: string | unknown[];
	sender_id: string;
	sender_type: 'user' | 'agent';
	timestamp: string;
	conversation_id: string;
	additional_kwargs?: Record<string, unknown>;
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
	metadata?: Record<string, unknown>;
}

export interface MessageChunk {
	message_id: string;
	chunk_id: string;
	content: string;
	sender_id: string;
	sender_name: string;
	conversation_id: string;
}
