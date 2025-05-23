import { io, Socket } from 'socket.io-client';
import type { LangServeEndpoint, Conversation, ChatMessage, MessageChunk } from '../types';
import { writable, derived, get } from 'svelte/store';

// Store types
interface LangServeState {
	socket: Socket | null;
	connected: boolean;
	authenticated: boolean;
	availableEndpoints: LangServeEndpoint[];
	conversations: Conversation[];
	activeConversationId: string | null;
	streamingMessages: Map<string, string>;
	connectionError: string | null;
	endpointHealth: Map<string, boolean>;
}

// Create the initial state
const initialState: LangServeState = {
	socket: null,
	connected: false,
	authenticated: false,
	availableEndpoints: [],
	conversations: [],
	activeConversationId: null,
	streamingMessages: new Map(),
	connectionError: null,
	endpointHealth: new Map()
};

// Create the writable store
const createLangServeStore = () => {
	// Create the store with initial state
	const { subscribe, update } = writable<LangServeState>(initialState);

	// Map to store streaming message timeouts
	const streamingTimeouts = new Map<string, NodeJS.Timeout>();

	// Connect to the Socket.IO server
	const connect = (serverUrl: string, userId: string, authToken?: string) => {
		update((state) => {
			// Clean up existing socket if there is one
			if (state.socket) {
				state.socket.disconnect();

				// Clear all timeouts
				streamingTimeouts.forEach((timeout) => clearTimeout(timeout));
				streamingTimeouts.clear();
			}

			// Create new socket
			const newSocket = io(serverUrl, {
				autoConnect: false,
				transports: ['websocket', 'polling']
			});

			// Set up event handlers

			// Connection events
			newSocket.on('connect', () => {
				update((s) => {
					s.connected = true;
					s.connectionError = null;
					return s;
				});
				newSocket.emit('authenticate', { user_id: userId, token: authToken });
			});

			newSocket.on('disconnect', () => {
				update((s) => {
					s.connected = false;
					s.authenticated = false;
					return s;
				});
			});

			newSocket.on('connect_error', (error) => {
				update((s) => {
					s.connectionError = error.message;
					return s;
				});
			});

			// Authentication
			newSocket.on(
				'authenticated',
				(data: { user_id: string; available_endpoints: LangServeEndpoint[] }) => {
					update((s) => {
						s.authenticated = true;
						s.availableEndpoints = data.available_endpoints;
						return s;
					});
					console.log('Authenticated with', data.available_endpoints.length, 'endpoints available');
				}
			);

			// Conversation management
			newSocket.on('conversation_created', (conversation: Conversation) => {
				update((s) => {
					s.conversations = [...s.conversations, conversation];
					s.activeConversationId = conversation.id;
					return s;
				});
			});

			newSocket.on('conversation_joined', (conversation: Conversation) => {
				update((s) => {
					const existingIndex = s.conversations.findIndex((c) => c.id === conversation.id);
					if (existingIndex >= 0) {
						s.conversations[existingIndex] = conversation;
					} else {
						s.conversations = [...s.conversations, conversation];
					}
					s.activeConversationId = conversation.id;
					return s;
				});
			});

			newSocket.on('conversations_list', (conversationsList: Conversation[]) => {
				update((s) => {
					s.conversations = conversationsList;
					return s;
				});
			});

			// Message events
			newSocket.on('message_received', (message: ChatMessage) => {
				update((s) => {
					s.conversations = s.conversations.map((conv) =>
						conv.id === message.conversation_id
							? { ...conv, messages: [...conv.messages, message] }
							: conv
					);
					return s;
				});
			});

			// Streaming events
			newSocket.on(
				'agent_response_start',
				(data: { message_id: string; endpoint_id: string; endpoint_name: string }) => {
					update((s) => {
						s.streamingMessages.set(data.message_id, '');
						return s;
					});
				}
			);

			newSocket.on('message_chunk', (chunk: MessageChunk) => {
				update((s) => {
					const current = s.streamingMessages.get(chunk.message_id) || '';
					s.streamingMessages.set(chunk.message_id, current + chunk.content);
					return s;
				});

				// Clear any existing timeout for this message
				const existingTimeout = streamingTimeouts.get(chunk.message_id);
				if (existingTimeout) {
					clearTimeout(existingTimeout);
				}

				// Set a timeout to clean up if streaming stops unexpectedly
				const timeout = setTimeout(() => {
					update((s) => {
						s.streamingMessages.delete(chunk.message_id);
						return s;
					});
					streamingTimeouts.delete(chunk.message_id);
				}, 10000);

				streamingTimeouts.set(chunk.message_id, timeout);
			});

			newSocket.on('agent_response_complete', (message: ChatMessage) => {
				// Clear streaming state
				update((s) => {
					s.streamingMessages.delete(message.id);

					// Add final message
					s.conversations = s.conversations.map((conv) =>
						conv.id === message.conversation_id
							? {
									...conv,
									messages: [...conv.messages.filter((m) => m.id !== message.id), message]
								}
							: conv
					);

					return s;
				});

				const timeout = streamingTimeouts.get(message.id);
				if (timeout) {
					clearTimeout(timeout);
					streamingTimeouts.delete(message.id);
				}
			});

			// Endpoint management
			newSocket.on('endpoint_schemas', (data: { endpoint_id: string; schemas: unknown }) => {
				update((s) => {
					s.availableEndpoints = s.availableEndpoints.map((ep) =>
						ep.id === data.endpoint_id ? { ...ep, ...data.schemas } : ep
					);
					return s;
				});
			});

			newSocket.on(
				'endpoint_test_result',
				(data: { endpoint_id: string; healthy: boolean; error?: string }) => {
					update((s) => {
						s.endpointHealth.set(data.endpoint_id, data.healthy);
						return s;
					});

					if (!data.healthy && data.error) {
						console.warn(`Endpoint ${data.endpoint_id} is unhealthy:`, data.error);
					}
				}
			);

			// Error handling
			newSocket.on('error', (error: { message: string }) => {
				update((s) => {
					s.connectionError = error.message;
					return s;
				});
				console.error('Socket error:', error.message);
			});

			newSocket.on(
				'agent_error',
				(error: { endpoint_id: string; endpoint_name: string; error: string }) => {
					console.error(`Agent error from ${error.endpoint_name}:`, error.error);
					// Could show user-friendly error message in UI
				}
			);

			newSocket.on(
				'agent_response_error',
				(error: { message_id: string; endpoint_id: string; error: string }) => {
					// Clean up streaming state on error
					update((s) => {
						s.streamingMessages.delete(error.message_id);
						return s;
					});
				}
			);

			// Connect the socket
			newSocket.connect();

			return {
				...state,
				socket: newSocket
			};
		});
	};

	const disconnect = () => {
		update((state) => {
			if (state.socket) {
				state.socket.disconnect();
			}

			// Clear all timeouts
			streamingTimeouts.forEach((timeout) => clearTimeout(timeout));
			streamingTimeouts.clear();

			return {
				...initialState,
				socket: null
			};
		});
	};

	// Endpoint management
	const testEndpoint = (endpointId: string) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('test_endpoint', { endpoint_id: endpointId });
			}
			return state;
		});
	};

	const getEndpointSchemas = (endpointId: string) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('get_endpoint_schemas', { endpoint_id: endpointId });
			}
			return state;
		});
	};

	const testAllEndpoints = () => {
		const state = get({ subscribe });
		if (state.socket && state.authenticated) {
			state.availableEndpoints.forEach((endpoint) => {
				testEndpoint(endpoint.id);
			});
		}
	};

	// Conversation management
	const createConversation = (
		endpointIds: string[],
		initialMessage?: string,
		config?: Record<string, unknown>
	) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('create_conversation', {
					endpoint_ids: endpointIds,
					initial_message: initialMessage,
					config
				});
			}
			return state;
		});
	};

	const joinConversation = (conversationId: string) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('join_conversation', { conversation_id: conversationId });
			}
			return state;
		});
	};

	const sendMessage = (
		conversationId: string,
		content: string,
		config?: Record<string, unknown>
	) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('send_message', {
					conversation_id: conversationId,
					content,
					config
				});
			}
			return state;
		});
	};

	const loadConversations = () => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('list_conversations');
			}
			return state;
		});
	};

	const getConversationHistory = (conversationId: string) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('get_conversation_history', { conversation_id: conversationId });
			}
			return state;
		});
	};

	const setActiveConversationId = (conversationId: string | null) => {
		update((state) => {
			state.activeConversationId = conversationId;
			return state;
		});
	};

	// Return the store object
	return {
		subscribe,

		// Connection management
		connect,
		disconnect,

		// Endpoint management
		testEndpoint,
		getEndpointSchemas,
		testAllEndpoints,

		// Conversation management
		createConversation,
		joinConversation,
		sendMessage,
		loadConversations,
		getConversationHistory,
		setActiveConversationId
	};
};

// Create and export the store
export const langserveStore = createLangServeStore();

// Export store functions for direct use
export const { 
	connect, 
	disconnect, 
	testEndpoint, 
	getEndpointSchemas, 
	testAllEndpoints, 
	createConversation, 
	joinConversation, 
	sendMessage, 
	loadConversations, 
	getConversationHistory, 
	setActiveConversationId 
} = langserveStore;

// Derived stores for convenience
export const connected = derived(langserveStore, ($store) => $store.connected);
export const authenticated = derived(langserveStore, ($store) => $store.authenticated);
export const connectionError = derived(langserveStore, ($store) => $store.connectionError);
export const availableEndpoints = derived(langserveStore, ($store) => $store.availableEndpoints);
export const conversations = derived(langserveStore, ($store) => $store.conversations);
export const activeConversationId = derived(
	langserveStore,
	($store) => $store.activeConversationId
);
export const streamingMessages = derived(langserveStore, ($store) =>
	Array.from($store.streamingMessages.entries())
);
export const hasStreamingMessages = derived(
	langserveStore,
	($store) => $store.streamingMessages.size > 0
);
export const endpointHealth = derived(langserveStore, ($store) => $store.endpointHealth);

// Derived store for the active conversation
export const activeConversation = derived([langserveStore], ([$store]) =>
	$store.conversations.find((c) => c.id === $store.activeConversationId)
);

// Helper to get display messages (with streaming content)
export function getDisplayMessages(conversationId: string) {
	const state = get(langserveStore);
	const conversation = state.conversations.find((c) => c.id === conversationId);
	if (!conversation) return [];

	const messages = [...conversation.messages];

	// Add streaming messages as temporary messages
	state.streamingMessages.forEach((content, messageId) => {
		if (content) {
			const streamingMessage: ChatMessage = {
				id: messageId,
				type: 'ai',
				content,
				sender_id: 'streaming',
				sender_type: 'agent',
				timestamp: new Date().toISOString(),
				conversation_id: conversationId,
				additional_kwargs: { streaming: true }
			};
			messages.push(streamingMessage);
		}
	});

	return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
