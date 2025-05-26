// Authentication handler for Socket.IO connections

import type { Socket } from 'socket.io';
import type { SocketHandler } from '../../types/socket.js';
import type { LangGraphManager } from '../../langgraph/LangGraphManager.js';

export class AuthHandler implements SocketHandler {
	private authenticatedUsers: Map<string, { userId: string; token?: string }> = new Map();

	constructor(private langGraphManager: LangGraphManager) {}

	handleConnection(socket: Socket): void {
		// Handle authentication request
		socket.on('authenticate', async (data: { user_id: string; token?: string }) => {
			try {
				await this.authenticateUser(socket, data.user_id, data.token);
			} catch (error) {
				console.error(`Authentication failed for user ${data.user_id}:`, error);
				socket.emit('error', {
					message: 'Authentication failed',
					code: 'AUTH_FAILED'
				});
			}
		});

		// Handle disconnection
		socket.on('disconnect', (reason) => {
			this.handleDisconnection(socket, reason);
		});
	}

	private async authenticateUser(socket: Socket, userId: string, token?: string): Promise<void> {
		console.log(`Authenticating user: ${userId.substring(0, 8)}...`);

		// TODO: Add proper JWT token validation here
		// For now, we'll accept any user_id as a basic authentication
		// In production, validate the JWT token against your auth system

		try {
			// Validate token if provided
			if (token) {
				// TODO: Implement JWT token validation
				// const isValidToken = await this.validateJwtToken(token);
				// if (!isValidToken) {
				//     throw new Error('Invalid token');
				// }
			}

			// Store authenticated user
			this.authenticatedUsers.set(socket.id, { userId, token });

			// Fetch available assistants
			const availableAssistants = await this.langGraphManager.fetchAvailableAssistants();

			// Emit authentication success
			socket.emit('authenticated', {
				user_id: userId,
				available_assistants: availableAssistants
			});

			console.log(
				`User authenticated successfully: ${userId.substring(0, 8)}... (${availableAssistants.length} assistants available)`
			);
		} catch (error) {
			console.error(`Authentication error for user ${userId}:`, error);
			throw error;
		}
	}

	private handleDisconnection(socket: Socket, reason: string): void {
		const authInfo = this.authenticatedUsers.get(socket.id);
		if (authInfo) {
			console.log(`User disconnected: ${authInfo.userId.substring(0, 8)}... (reason: ${reason})`);
			this.authenticatedUsers.delete(socket.id);
		}
	}

	/**
	 * Check if a socket is authenticated
	 */
	isAuthenticated(socket: Socket): boolean {
		return this.authenticatedUsers.has(socket.id);
	}

	/**
	 * Get authenticated user info for a socket
	 */
	getAuthenticatedUser(socket: Socket): { userId: string; token?: string } | null {
		return this.authenticatedUsers.get(socket.id) || null;
	}

	/**
	 * Get auth token for a socket
	 */
	getAuthToken(socket: Socket): string | undefined {
		return this.authenticatedUsers.get(socket.id)?.token;
	}

	/**
	 * Require authentication middleware
	 */
	requireAuth(socket: Socket, next: () => void): void {
		if (!this.isAuthenticated(socket)) {
			socket.emit('error', {
				message: 'Authentication required',
				code: 'AUTH_REQUIRED'
			});
			return;
		}
		next();
	}

	/**
	 * Get statistics about authenticated users
	 */
	getStats(): { authenticatedUsers: number; userIds: string[] } {
		const userIds = Array.from(this.authenticatedUsers.values()).map((auth) => auth.userId);
		return {
			authenticatedUsers: this.authenticatedUsers.size,
			userIds: userIds.map((id) => id.substring(0, 8) + '...')
		};
	}

	/**
	 * Clean up all authenticated users (for shutdown)
	 */
	cleanup(): void {
		console.log(`Cleaning up ${this.authenticatedUsers.size} authenticated users`);
		this.authenticatedUsers.clear();
	}
}
