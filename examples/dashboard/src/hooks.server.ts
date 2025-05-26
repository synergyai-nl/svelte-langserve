// Streamlined SvelteKit hooks using modular Socket.IO architecture

import type { Handle } from '@sveltejs/kit';
import { SocketServer } from '$lib/server/socket/SocketServer.js';

// Global instances
let socketServer: SocketServer | null = null;

export const handle: Handle = async ({ event, resolve }) => {
	// Initialize Socket.IO server if not already done
	if (!socketServer && event.platform?.node?.server) {
		try {
			console.log('Initializing Socket.IO server with modular architecture...');

			// Get LangGraph server URL from environment
			const langGraphServerUrl = process.env.PUBLIC_LANGGRAPH_SERVER_URL || 'http://localhost:8000';

			// Create new modular Socket server
			socketServer = new SocketServer(event.platform.node.server, langGraphServerUrl);

			console.log('Socket.IO server initialized successfully');
			console.log(`LangGraph server URL: ${langGraphServerUrl}`);

			// Log statistics periodically
			setInterval(() => {
				const stats = socketServer?.getStats();
				if (stats) {
					console.log('Socket.IO Server Stats:', {
						uptime: Math.round(stats.uptime / 1000) + 's',
						connections: stats.connections.current,
						authenticated: stats.auth.authenticatedUsers,
						assistants: stats.assistants.availableAssistants,
						streaming: stats.streaming.activeStreams
					});
				}
			}, 60000); // Every minute
		} catch (error) {
			console.error('Failed to initialize Socket.IO server:', error);
		}
	}

	// Add socket server to locals for potential access in routes
	if (socketServer) {
		event.locals.socketServer = socketServer;
	}

	return resolve(event);
};

// Graceful shutdown handling
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, shutting down gracefully...');
	if (socketServer) {
		await socketServer.shutdown();
	}
	process.exit(0);
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, shutting down gracefully...');
	if (socketServer) {
		await socketServer.shutdown();
	}
	process.exit(0);
});

// Export for testing/debugging
export { socketServer };
