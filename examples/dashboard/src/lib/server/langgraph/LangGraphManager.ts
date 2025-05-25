// LangGraph client manager for Socket.IO integration

import type {
	LangGraphAssistant,
	AssistantInvocationRequest,
	AssistantInvocationResponse,
	AssistantHealth
} from '../types/langgraph.js';

export class LangGraphManager {
	private serverUrl: string;
	private assistants: Map<string, LangGraphAssistant> = new Map();
	private healthStatus: Map<string, AssistantHealth> = new Map();

	constructor(serverUrl: string = 'http://localhost:8000') {
		this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
	}

	/**
	 * Initialize the manager by fetching available assistants
	 */
	async initialize(): Promise<void> {
		try {
			await this.fetchAvailableAssistants();
			await this.checkAllAssistantsHealth();
		} catch (error) {
			console.error('Failed to initialize LangGraph manager:', error);
			throw error;
		}
	}

	/**
	 * Fetch available assistants from the server
	 */
	async fetchAvailableAssistants(): Promise<LangGraphAssistant[]> {
		try {
			const response = await fetch(`${this.serverUrl}/assistants`);
			if (!response.ok) {
				throw new Error(`Failed to fetch assistants: ${response.status} ${response.statusText}`);
			}

			const assistantsData = await response.json();

			// Transform the response to our interface
			const assistants: LangGraphAssistant[] = Object.entries(assistantsData).map(
				([id, metadata]: [string, any]) => ({
					id,
					name: metadata.name,
					description: metadata.description,
					type: metadata.type || 'chat',
					supports_streaming: metadata.supports_streaming || false,
					supports_persistence: metadata.supports_persistence || false,
					has_tools: metadata.has_tools || false
				})
			);

			// Update internal cache
			this.assistants.clear();
			assistants.forEach((assistant) => {
				this.assistants.set(assistant.id, assistant);
			});

			return assistants;
		} catch (error) {
			console.error('Error fetching assistants:', error);
			throw error;
		}
	}

	/**
	 * Invoke an assistant with a message
	 */
	async invokeAssistant(
		assistantId: string,
		request: AssistantInvocationRequest,
		authToken?: string
	): Promise<AssistantInvocationResponse> {
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};

			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}

			const response = await fetch(`${this.serverUrl}/assistants/${assistantId}/invoke`, {
				method: 'POST',
				headers,
				body: JSON.stringify(request)
			});

			if (!response.ok) {
				throw new Error(`Assistant invocation failed: ${response.status} ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error(`Error invoking assistant ${assistantId}:`, error);
			throw error;
		}
	}

	/**
	 * Get assistant information
	 */
	async getAssistantInfo(
		assistantId: string,
		authToken?: string
	): Promise<LangGraphAssistant | null> {
		try {
			// Check cache first
			const cached = this.assistants.get(assistantId);
			if (cached) {
				return cached;
			}

			const headers: Record<string, string> = {};
			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}

			const response = await fetch(`${this.serverUrl}/assistants/${assistantId}`, {
				method: 'GET',
				headers
			});

			if (!response.ok) {
				if (response.status === 404) {
					return null;
				}
				throw new Error(`Failed to get assistant info: ${response.status} ${response.statusText}`);
			}

			const assistantData = await response.json();
			const assistant: LangGraphAssistant = {
				id: assistantId,
				name: assistantData.name,
				description: assistantData.description,
				type: assistantData.type || 'chat',
				supports_streaming: assistantData.supports_streaming || false,
				supports_persistence: assistantData.supports_persistence || false,
				has_tools: assistantData.has_tools || false
			};

			// Update cache
			this.assistants.set(assistantId, assistant);
			return assistant;
		} catch (error) {
			console.error(`Error getting assistant info for ${assistantId}:`, error);
			throw error;
		}
	}

	/**
	 * Check the health of a specific assistant
	 */
	async checkAssistantHealth(assistantId: string, authToken?: string): Promise<AssistantHealth> {
		try {
			const headers: Record<string, string> = {};
			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}

			const response = await fetch(`${this.serverUrl}/assistants/${assistantId}/health`, {
				method: 'GET',
				headers
			});

			if (!response.ok) {
				const health: AssistantHealth = {
					status: 'unhealthy',
					error: `HTTP ${response.status}: ${response.statusText}`,
					last_check: new Date().toISOString()
				};
				this.healthStatus.set(assistantId, health);
				return health;
			}

			const healthData = await response.json();
			const health: AssistantHealth = {
				status: healthData.status === 'healthy' ? 'healthy' : 'unhealthy',
				error: healthData.error,
				last_check: new Date().toISOString()
			};

			this.healthStatus.set(assistantId, health);
			return health;
		} catch (error) {
			const health: AssistantHealth = {
				status: 'unhealthy',
				error: error instanceof Error ? error.message : 'Unknown error',
				last_check: new Date().toISOString()
			};
			this.healthStatus.set(assistantId, health);
			return health;
		}
	}

	/**
	 * Check health of all assistants
	 */
	async checkAllAssistantsHealth(authToken?: string): Promise<Map<string, AssistantHealth>> {
		const healthPromises = Array.from(this.assistants.keys()).map((assistantId) =>
			this.checkAssistantHealth(assistantId, authToken).then((health) => ({ assistantId, health }))
		);

		const results = await Promise.allSettled(healthPromises);

		results.forEach((result) => {
			if (result.status === 'fulfilled') {
				this.healthStatus.set(result.value.assistantId, result.value.health);
			}
		});

		return new Map(this.healthStatus);
	}

	/**
	 * Get cached assistant data
	 */
	getAssistants(): LangGraphAssistant[] {
		return Array.from(this.assistants.values());
	}

	/**
	 * Get cached health status
	 */
	getHealthStatus(): Map<string, AssistantHealth> {
		return new Map(this.healthStatus);
	}

	/**
	 * Check if an assistant exists
	 */
	hasAssistant(assistantId: string): boolean {
		return this.assistants.has(assistantId);
	}

	/**
	 * Get server URL
	 */
	getServerUrl(): string {
		return this.serverUrl;
	}
}
