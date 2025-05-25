// Main Socket.IO server orchestrator for LangGraph integration

import { Server } from 'socket.io';
import { LangGraphManager } from '../langgraph/LangGraphManager.js';
import { StreamingManager } from '../langgraph/StreamingManager.js';
import { AuthHandler } from './handlers/AuthHandler.js';
import { AssistantHandler } from './handlers/AssistantHandler.js';
import { MessageHandler } from './handlers/MessageHandler.js';

export class SocketServer {
	private io: Server;
	private langGraphManager: LangGraphManager;
	private streamingManager: StreamingManager;

	// Handlers
	private authHandler: AuthHandler;
	private assistantHandler: AssistantHandler;
	private messageHandler: MessageHandler;

	// Statistics
	private startTime: number = Date.now();
	private connectionCount: number = 0;
	private totalConnections: number = 0;

	constructor(httpServer: any, langGraphServerUrl: string = 'http://localhost:8000') {
		// Initialize Socket.IO server
		this.io = new Server(httpServer, {
			cors: {
				origin: '*', // Configure appropriately for production
				methods: ['GET', 'POST']
			},
			path: '/api/socket.io/'
		});

		// Initialize managers
		this.langGraphManager = new LangGraphManager(langGraphServerUrl);
		this.streamingManager = new StreamingManager();

		// Initialize handlers
		this.authHandler = new AuthHandler(this.langGraphManager);
		this.assistantHandler = new AssistantHandler(this.langGraphManager, this.authHandler);
		this.messageHandler = new MessageHandler(
			this.langGraphManager,
			this.streamingManager,
			this.authHandler
		);

		this.setupEventHandlers();
		this.initializeManagers();
	}

	/**
	 * Initialize LangGraph manager
	 */
	private async initializeManagers(): Promise<void> {
		try {
			console.log('Initializing LangGraph manager...');
			await this.langGraphManager.initialize();
			console.log('LangGraph manager initialized successfully');
		} catch (error) {
			console.error('Failed to initialize LangGraph manager:', error);
			// Continue anyway - the manager will retry on demand
		}
	}

	/**
	 * Setup main Socket.IO event handlers
	 */
	private setupEventHandlers(): void {
		this.io.on('connection', (socket) => {
			this.handleConnection(socket);
		});

		// Graceful shutdown handling
		process.on('SIGTERM', () => this.shutdown());
		process.on('SIGINT', () => this.shutdown());
	}

	/**
	 * Handle new socket connection
	 */
	private handleConnection(socket: any): void {
		this.connectionCount++;
		this.totalConnections++;

		console.log(`New socket connection: ${socket.id} (total: ${this.connectionCount})`);

		// Set up error handling
		socket.on('error', (error: Error) => {
			console.error(`Socket error from ${socket.id}:`, error);
		});

		// Handle disconnection
		socket.on('disconnect', (reason: string) => {
			this.connectionCount--;
			console.log(
				`Socket disconnected: ${socket.id} (reason: ${reason}, remaining: ${this.connectionCount})`
			);
		});

		// Connect handlers
		this.authHandler.handleConnection(socket);
		this.assistantHandler.handleConnection(socket);
		this.messageHandler.handleConnection(socket);

		// Add global error handling
		this.addGlobalErrorHandling(socket);
	}

	/**
	 * Add global error handling for socket
	 */
	private addGlobalErrorHandling(socket: any): void {
		// Wrap all event handlers with error handling
		const originalOn = socket.on.bind(socket);
		socket.on = (event: string, handler: Function) => {
			return originalOn(event, async (...args: any[]) => {
				try {
					await handler(...args);
				} catch (error) {
					console.error(`Unhandled error in ${event} handler:`, error);
					socket.emit('error', {
						message: 'Internal server error',
						code: 'INTERNAL_ERROR'
					});
				}
			});
		};
	}

	/**
	 * Get Socket.IO server instance
	 */
	getServer(): Server {
		return this.io;
	}

	/**
	 * Get LangGraph manager
	 */
	getLangGraphManager(): LangGraphManager {
		return this.langGraphManager;
	}

	/**
	 * Get streaming manager
	 */
	getStreamingManager(): StreamingManager {
		return this.streamingManager;
	}

	/**
	 * Get server statistics
	 */
	getStats(): {
		uptime: number;
		connections: {
			current: number;
			total: number;
		};
		auth: ReturnType<AuthHandler['getStats']>;
		assistants: ReturnType<AssistantHandler['getStats']>;
		messages: ReturnType<MessageHandler['getStats']>;
		streaming: ReturnType<StreamingManager['getStats']>;
	} {
		return {
			uptime: Date.now() - this.startTime,
			connections: {
				current: this.connectionCount,
				total: this.totalConnections
			},
			auth: this.authHandler.getStats(),
			assistants: this.assistantHandler.getStats(),
			messages: this.messageHandler.getStats(),
			streaming: this.streamingManager.getStats()
		};
	}

	/**
	 * Broadcast message to all authenticated clients
	 */
	broadcastToAuthenticated(event: string, data: any): void {
		this.io.sockets.sockets.forEach((socket) => {
			if (this.authHandler.isAuthenticated(socket)) {
				socket.emit(event, data);
			}
		});
	}

	/**
	 * Send message to specific user
	 */
	sendToUser(userId: string, event: string, data: any): boolean {
		for (const [socketId, socket] of this.io.sockets.sockets) {
			const authUser = this.authHandler.getAuthenticatedUser(socket);
			if (authUser && authUser.userId === userId) {
				socket.emit(event, data);
				return true;
			}
		}
		return false;
	}

	/**
	 * Graceful shutdown
	 */
	async shutdown(): Promise<void> {
		console.log('Shutting down Socket server...');

		// Close all connections
		this.io.close();

		// Cleanup managers
		this.streamingManager.destroy();
		this.authHandler.cleanup();

		console.log('Socket server shutdown complete');
	}

	/**
	 * Health check
	 */
	async healthCheck(): Promise<{
		status: 'healthy' | 'degraded' | 'unhealthy';
		details: {
			socketServer: 'healthy' | 'unhealthy';
			langGraphManager: 'healthy' | 'unhealthy';
			streamingManager: 'healthy' | 'unhealthy';
			connections: number;
		};
	}> {
		const details = {
			socketServer: 'healthy' as 'healthy' | 'unhealthy',
			langGraphManager: 'healthy' as 'healthy' | 'unhealthy',
			streamingManager: 'healthy' as 'healthy' | 'unhealthy',
			connections: this.connectionCount
		};

		// Check LangGraph manager
		try {
			const assistants = this.langGraphManager.getAssistants();
			if (assistants.length === 0) {
				details.langGraphManager = 'unhealthy';
			}
		} catch {
			details.langGraphManager = 'unhealthy';
		}

		// Check streaming manager
		const streamingStats = this.streamingManager.getStats();
		if (streamingStats.activeStreams > 50) {
			// Arbitrary threshold
			details.streamingManager = 'unhealthy';
		}

		// Determine overall status
		const statusValues = [details.socketServer, details.langGraphManager, details.streamingManager];
		const unhealthyCount = statusValues.filter((s) => s === 'unhealthy').length;
		let status: 'healthy' | 'degraded' | 'unhealthy';

		if (unhealthyCount === 0) {
			status = 'healthy';
		} else if (unhealthyCount < 2) {
			status = 'degraded';
		} else {
			status = 'unhealthy';
		}

		return { status, details };
	}
}
