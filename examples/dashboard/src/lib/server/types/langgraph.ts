"""Type definitions for LangGraph integration."""

export interface LangGraphAssistant {
	id: string;
	name: string;
	description: string;
	type: string;
	supports_streaming: boolean;
	supports_persistence: boolean;
	has_tools?: boolean;
}

export interface AssistantInvocationRequest {
	message: string;
	thread_id?: string;
	config?: Record<string, any>;
}

export interface AssistantInvocationResponse {
	response: string;
	thread_id?: string;
	metadata?: Record<string, any>;
}

export interface ThreadInfo {
	id: string;
	assistant_ids: string[];
	user_id: string;
	created_at: string;
	updated_at: string;
	metadata?: Record<string, any>;
}

export interface AssistantHealth {
	status: 'healthy' | 'unhealthy';
	error?: string;
	last_check?: string;
}