import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { Server as SocketIOServer } from 'socket.io';

// Custom Vite plugin to add Socket.IO server during development
const socketIOPlugin = () => {
	return {
		name: 'socket-io',
		configureServer(server) {
			if (!server.httpServer) return;

			const io = new SocketIOServer(server.httpServer, {
				cors: {
					origin: '*',
					methods: ['GET', 'POST']
				},
				path: '/api/socket.io/'
			});

			// Simple demo Socket.IO handlers
			io.on('connection', (socket) => {
				console.log('Client connected to dev server:', socket.id);

				// Authentication
				socket.on('authenticate', async (data) => {
					console.log('User authenticated:', data.user_id);

					// Mock endpoints for development
					const mockEndpoints = [
						{
							id: 'chatbot',
							name: 'General Chatbot',
							url: 'http://localhost:8000/chatbot',
							type: 'chatbot'
						},
						{
							id: 'code-assistant',
							name: 'Code Assistant',
							url: 'http://localhost:8000/code-assistant',
							type: 'code-assistant'
						}
					];

					socket.emit('authenticated', {
						user_id: data.user_id,
						available_endpoints: mockEndpoints
					});
				});

				// Create conversation
				socket.on('create_conversation', async (data) => {
					console.log('Creating conversation with endpoints:', data.endpoint_ids);

					const conversation = {
						id: `conv_${Date.now()}`,
						title: `Conversation with ${data.endpoint_ids.length} endpoint(s)`,
						messages: [],
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						participants: {
							users: [socket.id],
							agents: data.endpoint_ids.map((id) => ({ id, name: `Agent ${id}` }))
						},
						status: 'active'
					};

					socket.join(conversation.id);
					socket.emit('conversation_created', conversation);
				});

				// Send message
				socket.on('send_message', async (data) => {
					console.log('Message received:', data.content);

					// Echo back a demo response
					const userMessage = {
						id: `msg_${Date.now()}`,
						type: 'human',
						content: data.content,
						sender_id: socket.id,
						sender_type: 'user',
						timestamp: new Date().toISOString(),
						conversation_id: data.conversation_id
					};

					const aiMessage = {
						id: `msg_${Date.now() + 1}`,
						type: 'ai',
						content: `Echo: ${data.content}`,
						sender_id: 'demo-agent',
						sender_type: 'agent',
						timestamp: new Date().toISOString(),
						conversation_id: data.conversation_id
					};

					// Send user message first
					io.to(data.conversation_id).emit('message_received', userMessage);

					// Send AI response after a delay
					setTimeout(() => {
						io.to(data.conversation_id).emit('message_received', aiMessage);
					}, 1000);
				});

				socket.on('disconnect', () => {
					console.log('Client disconnected:', socket.id);
				});
			});
		}
	};
};

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		}),
		socketIOPlugin()
	],
	build: {
		rollupOptions: {
			external: ['socket.io']
		}
	},
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
