"""Assistant management handler for Socket.IO connections."""

import type { Socket } from 'socket.io';
import type { SocketHandler } from '../../types/socket.js';
import type { LangGraphManager } from '../../langgraph/LangGraphManager.js';
import type { AuthHandler } from './AuthHandler.js';

export class AssistantHandler implements SocketHandler {
	constructor(
		private langGraphManager: LangGraphManager,
		private authHandler: AuthHandler
	) {}

	handleConnection(socket: Socket): void {
		// Test assistant health
		socket.on('test_assistant', async (data: { assistant_id: string }) => {
			if (!this.authHandler.isAuthenticated(socket)) {
				socket.emit('error', { message: 'Authentication required', code: 'AUTH_REQUIRED' });
				return;
			}

			try {
				await this.testAssistant(socket, data.assistant_id);
			} catch (error) {
				console.error(`Error testing assistant ${data.assistant_id}:`, error);
				socket.emit('assistant_test_result', {
					assistant_id: data.assistant_id,
					healthy: false,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		});

		// Get assistant information
		socket.on('get_assistant_info', async (data: { assistant_id: string }) => {
			if (!this.authHandler.isAuthenticated(socket)) {
				socket.emit('error', { message: 'Authentication required', code: 'AUTH_REQUIRED' });
				return;
			}

			try {
				await this.getAssistantInfo(socket, data.assistant_id);
			} catch (error) {
				console.error(`Error getting assistant info for ${data.assistant_id}:`, error);
				socket.emit('error', {
					message: `Failed to get assistant info: ${error instanceof Error ? error.message : 'Unknown error'}`,
					code: 'ASSISTANT_INFO_FAILED'
				});
			}
		});

		// Test all assistants
		socket.on('test_all_assistants', async () => {
			if (!this.authHandler.isAuthenticated(socket)) {
				socket.emit('error', { message: 'Authentication required', code: 'AUTH_REQUIRED' });
				return;
			}

			try {
				await this.testAllAssistants(socket);
			} catch (error) {
				console.error('Error testing all assistants:', error);
				socket.emit('error', {
					message: `Failed to test assistants: ${error instanceof Error ? error.message : 'Unknown error'}`,
					code: 'ASSISTANT_TEST_FAILED'
				});
			}
		});

		// Refresh assistants list
		socket.on('refresh_assistants', async () => {
			if (!this.authHandler.isAuthenticated(socket)) {
				socket.emit('error', { message: 'Authentication required', code: 'AUTH_REQUIRED' });
				return;
			}

			try {
				await this.refreshAssistants(socket);
			} catch (error) {
				console.error('Error refreshing assistants:', error);
				socket.emit('error', {
					message: `Failed to refresh assistants: ${error instanceof Error ? error.message : 'Unknown error'}`,
					code: 'ASSISTANT_REFRESH_FAILED'
				});
			}
		});
	}

	private async testAssistant(socket: Socket, assistantId: string): Promise<void> {
		console.log(`Testing assistant: ${assistantId}`);

		const authToken = this.authHandler.getAuthToken(socket);
		const health = await this.langGraphManager.checkAssistantHealth(assistantId, authToken);

		socket.emit('assistant_test_result', {
			assistant_id: assistantId,
			healthy: health.status === 'healthy',
			error: health.error,
			last_check: health.last_check
		});

		console.log(`Assistant ${assistantId} test result: ${health.status}`);
	}

	private async getAssistantInfo(socket: Socket, assistantId: string): Promise<void> {
		console.log(`Getting assistant info: ${assistantId}`);

		const authToken = this.authHandler.getAuthToken(socket);
		const assistant = await this.langGraphManager.getAssistantInfo(assistantId, authToken);

		if (!assistant) {
			socket.emit('error', {
				message: `Assistant ${assistantId} not found`,
				code: 'ASSISTANT_NOT_FOUND'
			});
			return;
		}

		socket.emit('assistant_info', {
			assistant_id: assistantId,
			info: assistant
		});

		console.log(`Sent assistant info for: ${assistantId}`);
	}

	private async testAllAssistants(socket: Socket): Promise<void> {
		console.log('Testing all assistants...');

		const authToken = this.authHandler.getAuthToken(socket);
		const healthResults = await this.langGraphManager.checkAllAssistantsHealth(authToken);

		// Emit individual results
		for (const [assistantId, health] of healthResults) {
			socket.emit('assistant_test_result', {
				assistant_id: assistantId,
				healthy: health.status === 'healthy',
				error: health.error,
				last_check: health.last_check
			});
		}

		const healthyCount = Array.from(healthResults.values()).filter(h => h.status === 'healthy').length;
		console.log(`Tested all assistants: ${healthyCount}/${healthResults.size} healthy`);
	}

	private async refreshAssistants(socket: Socket): Promise<void> {
		console.log('Refreshing assistants list...');

		try {
			const assistants = await this.langGraphManager.fetchAvailableAssistants();
			
			// Also refresh health status
			const authToken = this.authHandler.getAuthToken(socket);
			await this.langGraphManager.checkAllAssistantsHealth(authToken);

			// Send updated list
			const userInfo = this.authHandler.getAuthenticatedUser(socket);
			if (userInfo) {
				socket.emit('authenticated', {
					user_id: userInfo.userId,
					available_assistants: assistants
				});
			}

			console.log(`Refreshed assistants list: ${assistants.length} assistants available`);
		} catch (error) {
			console.error('Failed to refresh assistants:', error);
			throw error;
		}
	}

	/**
	 * Get assistant statistics
	 */
	getStats(): {
		availableAssistants: number;
		healthyAssistants: number;
		lastHealthCheck: string | null;
	} {
		const assistants = this.langGraphManager.getAssistants();
		const healthStatus = this.langGraphManager.getHealthStatus();
		
		const healthyCount = Array.from(healthStatus.values())
			.filter(h => h.status === 'healthy').length;

		const lastChecks = Array.from(healthStatus.values())
			.map(h => h.last_check)
			.filter(Boolean)
			.sort()
			.reverse();

		return {
			availableAssistants: assistants.length,
			healthyAssistants: healthyCount,
			lastHealthCheck: lastChecks[0] || null
		};
	}
}