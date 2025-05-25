// Type definitions for Socket.IO events and handlers

import type { Socket } from 'socket.io';
import type { LangGraphAssistant, ThreadInfo } from './langgraph.js';

// Socket.IO Event Types
export interface SocketEvents {
	// Authentication events
	authenticate: (data: { user_id: string; token?: string }) => void;
	authenticated: (data: { user_id: string; available_assistants: LangGraphAssistant[] }) => void;

	// Thread/Conversation events
	create_thread: (data: {
		assistant_ids: string[];
		initial_message?: string;
		config?: Record<string, any>;
	}) => void;
	thread_created: (thread: ThreadInfo) => void;
	join_thread: (data: { thread_id: string }) => void;
	thread_joined: (thread: ThreadInfo) => void;
	list_threads: () => void;
	threads_list: (threads: ThreadInfo[]) => void;

	// Message events
	send_message: (data: {
		thread_id: string;
		content: string;
		config?: Record<string, any>;
	}) => void;
	message_received: (message: ChatMessage) => void;

	// Streaming events
	assistant_response_start: (data: {
		message_id: string;
		assistant_id: string;
		assistant_name: string;
	}) => void;
	message_chunk: (chunk: MessageChunk) => void;
	assistant_response_complete: (message: ChatMessage) => void;
	assistant_response_error: (error: {
		message_id: string;
		assistant_id: string;
		error: string;
	}) => void;

	// Assistant management events
	test_assistant: (data: { assistant_id: string }) => void;
	assistant_test_result: (data: { assistant_id: string; healthy: boolean; error?: string }) => void;
	get_assistant_info: (data: { assistant_id: string }) => void;
	assistant_info: (data: { assistant_id: string; info: LangGraphAssistant }) => void;

	// Error events
	error: (error: { message: string; code?: string }) => void;
	assistant_error: (error: { assistant_id: string; assistant_name: string; error: string }) => void;
}

// Message types
export interface ChatMessage {
	id: string;
	type: 'human' | 'ai' | 'system';
	content: string;
	sender_id: string;
	sender_type: 'user' | 'assistant' | 'system';
	timestamp: string;
	thread_id: string;
	assistant_id?: string;
	additional_kwargs?: Record<string, any>;
}

export interface MessageChunk {
	message_id: string;
	content: string;
	chunk_index: number;
	is_final: boolean;
}

// Socket handler interface
export interface SocketHandler {
	handleConnection(socket: Socket): void;
}

// Socket middleware interface
export interface SocketMiddleware {
	(socket: Socket, next: (err?: Error) => void): void;
}
