import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { Server as SocketIOServer } from 'socket.io';

// Custom Vite plugin to add Socket.IO server during development
const socketIOPlugin = () => {
	let authToken: string | null = null;

	// Function to get auth token from LangServe backend
	async function getAuthToken() {
		if (authToken) return authToken;
		
		try {
			const response = await fetch('http://localhost:8000/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: 'username=demo&password=secret'
			});

			if (response.ok) {
				const data = await response.json();
				authToken = data.access_token;
				console.log('Got LangServe auth token');
				return authToken;
			} else {
				console.error('Failed to get auth token:', response.status);
				return null;
			}
		} catch (error) {
			console.error('Error getting auth token:', error);
			return null;
		}
	}

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

				// Send message - integrate with real LangServe backend
				socket.on('send_message', async (data) => {
					console.log('Message received:', data.content);

					// Send user message first
					const userMessage = {
						id: `msg_${Date.now()}`,
						type: 'human',
						content: data.content,
						sender_id: socket.id,
						sender_type: 'user',
						timestamp: new Date().toISOString(),
						conversation_id: data.conversation_id
					};
					io.to(data.conversation_id).emit('message_received', userMessage);

					// Call real LangServe backend
					try {
						const token = await getAuthToken();
						if (!token) {
							throw new Error('Could not get auth token');
						}

						// Use streaming if enabled in config
						if (data.config?.streaming !== false) {
							// Use streaming endpoint
							const response = await fetch('http://localhost:8000/chatbot/stream', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${token}`
								},
								body: JSON.stringify({
									input: {
										messages: [
											{
												type: 'human',
												content: data.content
											}
										]
									}
								})
							});

							if (response.ok && response.body) {
								const messageId = `msg_${Date.now() + 1}`;
								let accumulatedContent = '';

								// Emit streaming start event
								io.to(data.conversation_id).emit('agent_response_start', {
									message_id: messageId,
									endpoint_id: 'chatbot',
									endpoint_name: 'General Chatbot',
									conversation_id: data.conversation_id
								});

								const reader = response.body.getReader();
								const decoder = new TextDecoder();

								try {
									while (true) {
										const { done, value } = await reader.read();
										if (done) break;

										const chunk = decoder.decode(value);
										const lines = chunk.split('\n');

										let isDataEvent = false;
										for (const line of lines) {
											const trimmedLine = line.trim();
											
											// Check for event type
											if (trimmedLine.startsWith('event: data')) {
												isDataEvent = true;
												continue;
											}
											
											// Parse data lines when we're in a data event
											if (isDataEvent && trimmedLine.startsWith('data: ')) {
												try {
													const jsonStr = trimmedLine.slice(6);
													if (!jsonStr || jsonStr === '""') {
														// Empty data, continue
														continue;
													}
													
													// Parse the JSON string (it's quoted)
													const content = JSON.parse(jsonStr);
													
													if (content && typeof content === 'string') {
														accumulatedContent += content;
														
														// Emit streaming chunk
														io.to(data.conversation_id).emit('message_chunk', {
															message_id: messageId,
															chunk_id: `chunk_${Date.now()}`,
															content: content,
															sender_id: 'chatbot',
															sender_name: 'General Chatbot',
															conversation_id: data.conversation_id
														});
													}
												} catch (parseError) {
													console.error('Error parsing stream chunk:', parseError, 'Line:', trimmedLine);
												}
												isDataEvent = false; // Reset after processing data
											}
											
											// Reset flag on empty line (SSE event separator)
											if (trimmedLine === '') {
												isDataEvent = false;
											}
										}
									}

									// Emit final message
									const finalMessage = {
										id: messageId,
										type: 'ai',
										content: accumulatedContent,
										sender_id: 'chatbot',
										sender_type: 'agent',
										timestamp: new Date().toISOString(),
										conversation_id: data.conversation_id,
										additional_kwargs: { endpoint_name: 'General Chatbot' }
									};

									io.to(data.conversation_id).emit('agent_response_complete', finalMessage);
								} catch (streamError) {
									console.error('Streaming error:', streamError);
									io.to(data.conversation_id).emit('agent_response_error', {
										message_id: messageId,
										endpoint_id: 'chatbot',
										error: streamError.message
									});
								}
							} else {
								throw new Error(`Streaming request failed: ${response.status}`);
							}
						} else {
							// Use non-streaming endpoint
							const response = await fetch('http://localhost:8000/chatbot/invoke', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${token}`
								},
								body: JSON.stringify({
									input: {
										messages: [
											{
												type: 'human',
												content: data.content
											}
										]
									}
								})
							});

							if (response.ok) {
								const result = await response.json();
								console.log('LangServe response:', result);

								// Extract content from LangServe response
								let content = 'No response from AI';
								if (result?.output && typeof result.output === 'string') {
									content = result.output;
								} else if (result?.output?.content) {
									content = result.output.content;
								} else if (result?.content) {
									content = result.content;
								} else if (typeof result === 'string') {
									content = result;
								}

								const aiMessage = {
									id: `msg_${Date.now() + 1}`,
									type: 'ai',
									content: content,
									sender_id: 'chatbot',
									sender_type: 'agent',
									timestamp: new Date().toISOString(),
									conversation_id: data.conversation_id
								};

								io.to(data.conversation_id).emit('message_received', aiMessage);
							}
						} else {
							console.error('LangServe request failed:', response.status, response.statusText);
							// Send error message
							const errorMessage = {
								id: `msg_${Date.now() + 1}`,
								type: 'ai',
								content: `Error: Failed to get response from LangServe backend (${response.status})`,
								sender_id: 'system',
								sender_type: 'agent',
								timestamp: new Date().toISOString(),
								conversation_id: data.conversation_id
							};
							io.to(data.conversation_id).emit('message_received', errorMessage);
						}
					} catch (error) {
						console.error('Error calling LangServe:', error);
						// Send error message
						const errorMessage = {
							id: `msg_${Date.now() + 1}`,
							type: 'ai',
							content: `Error: Could not connect to LangServe backend. Is it running on localhost:8000?`,
							sender_id: 'system',
							sender_type: 'agent',
							timestamp: new Date().toISOString(),
							conversation_id: data.conversation_id
						};
						io.to(data.conversation_id).emit('message_received', errorMessage);
					}
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
