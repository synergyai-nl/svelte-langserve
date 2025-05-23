import { io, Socket } from 'socket.io-client';
import type { LangServeEndpoint, Conversation, ChatMessage, MessageChunk } from '../types';
import { writable, derived, get } from 'svelte/store';
import { logger, socketLogger, streamingLogger, performanceLogger } from '../../utils/logger';

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
	messagePagination: Map<
		string,
		{
			currentPage: number;
			messagesPerPage: number;
			totalMessages: number;
			hasMore: boolean;
		}
	>;
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
	endpointHealth: new Map(),
	messagePagination: new Map()
};

// Create the writable store
const createLangServeStore = () => {
	// Create the store with initial state
	const { subscribe, update } = writable<LangServeState>(initialState);

	// Map to store streaming message timeouts and cleanup functions
	const streamingTimeouts = new Map<string, NodeJS.Timeout>();
	const streamingCleanup = new Map<string, () => void>();

	// Constants for memory management
	const STREAMING_TIMEOUT = 30000; // 30 seconds
	const MAX_STREAMING_MESSAGES = 10; // Maximum concurrent streaming messages
	const CLEANUP_INTERVAL = 60000; // 1 minute

	// Periodic cleanup function
	let cleanupInterval: NodeJS.Timeout | null = null;

	const startCleanupInterval = () => {
		if (cleanupInterval) clearInterval(cleanupInterval);
		cleanupInterval = setInterval(() => {
			// Clean up stale streaming messages
			const now = Date.now();
			streamingTimeouts.forEach((timeout, messageId) => {
				// Force cleanup of very old streaming messages
				const elapsed = now - parseInt(messageId.split('-')[1] || '0', 10);
				if (elapsed > STREAMING_TIMEOUT * 2) {
					cleanupStreamingMessage(messageId);
				}
			});
		}, CLEANUP_INTERVAL);
	};

	const stopCleanupInterval = () => {
		if (cleanupInterval) {
			clearInterval(cleanupInterval);
			cleanupInterval = null;
		}
	};

	const cleanupStreamingMessage = (messageId: string) => {
		streamingLogger.debug('Cleaning up streaming message', {
			messageId: messageId.substring(0, 8) + '...'
		});

		// Clear timeout
		const timeout = streamingTimeouts.get(messageId);
		if (timeout) {
			clearTimeout(timeout);
			streamingTimeouts.delete(messageId);
		}

		// Run custom cleanup
		const cleanup = streamingCleanup.get(messageId);
		if (cleanup) {
			cleanup();
			streamingCleanup.delete(messageId);
		}

		// Remove from store
		update((state) => {
			state.streamingMessages.delete(messageId);
			return state;
		});
	};

	// Connect to the Socket.IO server
	const connect = (serverUrl: string, userId: string, authToken?: string) => {
		socketLogger.info('Initiating connection', {
			serverUrl,
			userId: userId.substring(0, 8) + '...'
		});
		performanceLogger.time('connection-establish');

		update((state) => {
			// Clean up existing socket if there is one
			if (state.socket) {
				socketLogger.info('Cleaning up existing socket connection');
				state.socket.disconnect();

				// Clear all timeouts and cleanup functions
				streamingTimeouts.forEach((timeout) => clearTimeout(timeout));
				streamingTimeouts.clear();
				streamingCleanup.forEach((cleanup) => cleanup());
				streamingCleanup.clear();

				// Stop cleanup interval
				stopCleanupInterval();
			}

			// Create new socket
			const newSocket = io(serverUrl, {
				autoConnect: false,
				transports: ['websocket', 'polling']
			});

			// Set up event handlers

			// Connection events
			newSocket.on('connect', () => {
				socketLogger.info('Socket connected successfully');
				performanceLogger.timeEnd('connection-establish');

				update((s) => {
					s.connected = true;
					s.connectionError = null;
					return s;
				});
				// Start cleanup interval when connected
				startCleanupInterval();
				socketLogger.debug('Sending authentication request', {
					userId: userId.substring(0, 8) + '...'
				});
				newSocket.emit('authenticate', { user_id: userId, token: authToken });
			});

			newSocket.on('disconnect', (reason) => {
				socketLogger.warn('Socket disconnected', { reason });
				update((s) => {
					s.connected = false;
					s.authenticated = false;
					return s;
				});
			});

			newSocket.on('connect_error', (error) => {
				socketLogger.error('Connection error', { error: error.message }, error);
				update((s) => {
					s.connectionError = error.message;
					return s;
				});
			});

			// Authentication
			newSocket.on(
				'authenticated',
				(data: { user_id: string; available_endpoints: LangServeEndpoint[] }) => {
					socketLogger.info('Authentication successful', {
						userId: data.user_id.substring(0, 8) + '...',
						endpointCount: data.available_endpoints.length
					});

					update((s) => {
						s.authenticated = true;
						s.availableEndpoints = data.available_endpoints;
						return s;
					});

					logger.setUserContext(data.user_id);
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
					streamingLogger.info('Agent response started', {
						messageId: data.message_id.substring(0, 8) + '...',
						endpointId: data.endpoint_id,
						endpointName: data.endpoint_name
					});

					// Check for too many concurrent streaming messages
					if (streamingTimeouts.size >= MAX_STREAMING_MESSAGES) {
						streamingLogger.warn(
							'Maximum concurrent streaming messages reached, cleaning up oldest',
							{
								currentCount: streamingTimeouts.size,
								maxAllowed: MAX_STREAMING_MESSAGES
							}
						);

						// Clean up oldest streaming messages
						const oldestMessageId = Array.from(streamingTimeouts.keys())[0];
						if (oldestMessageId) {
							cleanupStreamingMessage(oldestMessageId);
						}
					}

					update((s) => {
						s.streamingMessages.set(data.message_id, '');
						return s;
					});
				}
			);

			newSocket.on('message_chunk', (chunk: MessageChunk) => {
				streamingLogger.debug('Received message chunk', {
					messageId: chunk.message_id.substring(0, 8) + '...',
					chunkLength: chunk.content.length
				});

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
					streamingLogger.warn('Streaming timeout reached, cleaning up message', {
						messageId: chunk.message_id.substring(0, 8) + '...',
						timeoutMs: STREAMING_TIMEOUT
					});
					cleanupStreamingMessage(chunk.message_id);
				}, STREAMING_TIMEOUT);

				streamingTimeouts.set(chunk.message_id, timeout);
			});

			newSocket.on('agent_response_complete', (message: ChatMessage) => {
				streamingLogger.info('Agent response completed', {
					messageId: message.id.substring(0, 8) + '...',
					conversationId: message.conversation_id.substring(0, 8) + '...',
					contentLength: message.content.length
				});

				// Clear streaming state using our cleanup function
				cleanupStreamingMessage(message.id);

				// Add final message
				update((s) => {
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
					// Clean up streaming state on error using our cleanup function
					cleanupStreamingMessage(error.message_id);
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

			// Clear all timeouts and cleanup functions
			streamingTimeouts.forEach((timeout) => clearTimeout(timeout));
			streamingTimeouts.clear();
			streamingCleanup.forEach((cleanup) => cleanup());
			streamingCleanup.clear();

			// Stop cleanup interval
			stopCleanupInterval();

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
			// Initialize pagination for new conversation
			if (conversationId && !state.messagePagination.has(conversationId)) {
				state.messagePagination.set(conversationId, {
					currentPage: 1,
					messagesPerPage: 50,
					totalMessages: 0,
					hasMore: false
				});
			}
			return state;
		});
	};

	const updateMessagePagination = (
		conversationId: string,
		updates: Partial<{
			currentPage: number;
			messagesPerPage: number;
			totalMessages: number;
			hasMore: boolean;
		}>
	) => {
		update((state) => {
			const existing = state.messagePagination.get(conversationId) || {
				currentPage: 1,
				messagesPerPage: 50,
				totalMessages: 0,
				hasMore: false
			};
			state.messagePagination.set(conversationId, { ...existing, ...updates });
			return state;
		});
	};

	const loadMoreMessages = (conversationId: string) => {
		update((state) => {
			const pagination = state.messagePagination.get(conversationId);
			if (pagination && pagination.hasMore && state.socket && state.authenticated) {
				const nextPage = pagination.currentPage + 1;
				state.socket.emit('load_conversation_messages', {
					conversation_id: conversationId,
					page: nextPage,
					limit: pagination.messagesPerPage
				});
				pagination.currentPage = nextPage;
			}
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
		setActiveConversationId,

		// Message pagination
		updateMessagePagination,
		loadMoreMessages
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
	setActiveConversationId,
	updateMessagePagination,
	loadMoreMessages
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

// Helper to get display messages (with streaming content and pagination)
export function getDisplayMessages(conversationId: string, limit?: number) {
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

	const sortedMessages = messages.sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);

	// Apply pagination if specified
	if (limit && limit > 0) {
		const pagination = state.messagePagination.get(conversationId);
		if (pagination) {
			const startIndex = Math.max(
				0,
				sortedMessages.length - pagination.currentPage * pagination.messagesPerPage
			);
			return sortedMessages.slice(startIndex);
		}
		// Fallback: return last N messages
		return sortedMessages.slice(-limit);
	}

	return sortedMessages;
}

// Helper to get pagination info for a conversation
export function getMessagePagination(conversationId: string) {
	const state = get(langserveStore);
	return (
		state.messagePagination.get(conversationId) || {
			currentPage: 1,
			messagesPerPage: 50,
			totalMessages: 0,
			hasMore: false
		}
	);
}
