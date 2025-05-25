import { io, Socket } from 'socket.io-client';
import type { LangGraphAssistant, Conversation, ChatMessage, MessageChunk } from '../types';
import { writable, derived, get } from 'svelte/store';
import { logger, socketLogger, streamingLogger } from '../utils/logger';

// Store types
interface LangGraphState {
	socket: Socket | null;
	connected: boolean;
	authenticated: boolean;
	availableAssistants: LangGraphAssistant[];
	conversations: Conversation[];
	activeConversationId: string | null;
	streamingMessages: Map<string, string>;
	connectionError: string | null;
	assistantHealth: Map<string, boolean>;
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
const initialState: LangGraphState = {
	socket: null,
	connected: false,
	authenticated: false,
	availableAssistants: [],
	conversations: [],
	activeConversationId: null,
	streamingMessages: new Map(),
	connectionError: null,
	assistantHealth: new Map(),
	messagePagination: new Map()
};

// Create the writable store
const createLangGraphStore = () => {
	// Create the store with initial state
	const { subscribe, update } = writable<LangGraphState>(initialState);

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
		logger.time('connection-establish');

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
				logger.timeEnd('connection-establish');

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
				(data: { user_id: string; available_assistants: LangGraphAssistant[] }) => {
					socketLogger.info('Authentication successful', {
						userId: data.user_id.substring(0, 8) + '...',
						assistantCount: data.available_assistants.length
					});

					update((s) => {
						s.authenticated = true;
						s.availableAssistants = data.available_assistants;
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
				'assistant_response_start',
				(data: { message_id: string; assistant_id: string; assistant_name: string }) => {
					streamingLogger.info('Assistant response started', {
						messageId: data.message_id.substring(0, 8) + '...',
						assistantId: data.assistant_id,
						assistantName: data.assistant_name
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

			newSocket.on('assistant_response_complete', (message: ChatMessage) => {
				streamingLogger.info('Assistant response completed', {
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

			// Assistant management
			newSocket.on('assistant_schemas', (data: { assistant_id: string; schemas: unknown }) => {
				update((s) => {
					s.availableAssistants = s.availableAssistants.map((assistant) =>
						assistant.id === data.assistant_id
							? { ...assistant, ...(data.schemas as Record<string, unknown>) }
							: assistant
					);
					return s;
				});
			});

			newSocket.on(
				'assistant_test_result',
				(data: { assistant_id: string; healthy: boolean; error?: string }) => {
					update((s) => {
						s.assistantHealth.set(data.assistant_id, data.healthy);
						return s;
					});

					if (!data.healthy && data.error) {
						console.warn(`Assistant ${data.assistant_id} is unhealthy:`, data.error);
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
				'assistant_error',
				(error: { assistant_id: string; assistant_name: string; error: string }) => {
					console.error(`Assistant error from ${error.assistant_name}:`, error.error);
					// Could show user-friendly error message in UI
				}
			);

			newSocket.on(
				'assistant_response_error',
				(error: { message_id: string; assistant_id: string; error: string }) => {
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

	// Assistant management
	const testAssistant = (assistantId: string) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('test_assistant', { assistant_id: assistantId });
			}
			return state;
		});
	};

	const getAssistantSchemas = (assistantId: string) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('get_assistant_schemas', { assistant_id: assistantId });
			}
			return state;
		});
	};

	const testAllAssistants = () => {
		const state = get({ subscribe });
		if (state.socket && state.authenticated) {
			state.availableAssistants.forEach((assistant) => {
				testAssistant(assistant.id);
			});
		}
	};

	// Conversation management
	const createConversation = (
		assistantIds: string[],
		initialMessage?: string,
		config?: Record<string, unknown>
	) => {
		update((state) => {
			if (state.socket && state.authenticated) {
				state.socket.emit('create_conversation', {
					assistant_ids: assistantIds,
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

		// Assistant management
		testAssistant,
		getAssistantSchemas,
		testAllAssistants,

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
export const langgraphStore = createLangGraphStore();

// Export store functions for direct use
export const {
	connect,
	disconnect,
	testAssistant,
	getAssistantSchemas,
	testAllAssistants,
	createConversation,
	joinConversation,
	sendMessage,
	loadConversations,
	getConversationHistory,
	setActiveConversationId,
	updateMessagePagination,
	loadMoreMessages
} = langgraphStore;

// Derived stores for convenience
export const connected = derived(langgraphStore, ($store) => $store.connected);
export const authenticated = derived(langgraphStore, ($store) => $store.authenticated);
export const connectionError = derived(langgraphStore, ($store) => $store.connectionError);
export const availableAssistants = derived(langgraphStore, ($store) => $store.availableAssistants);
export const conversations = derived(langgraphStore, ($store) => $store.conversations);
export const activeConversationId = derived(
	langgraphStore,
	($store) => $store.activeConversationId
);
export const streamingMessages = derived(langgraphStore, ($store) =>
	Array.from($store.streamingMessages.entries())
);
export const hasStreamingMessages = derived(
	langgraphStore,
	($store) => $store.streamingMessages.size > 0
);
export const assistantHealth = derived(langgraphStore, ($store) => $store.assistantHealth);

// Derived store for the active conversation
export const activeConversation = derived([langgraphStore], ([$store]) =>
	$store.conversations.find((c) => c.id === $store.activeConversationId)
);

// Helper to get display messages (with streaming content and pagination)
export function getDisplayMessages(conversationId: string, limit?: number) {
	const state = get(langgraphStore);
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
	const state = get(langgraphStore);
	return (
		state.messagePagination.get(conversationId) || {
			currentPage: 1,
			messagesPerPage: 50,
			totalMessages: 0,
			hasMore: false
		}
	);
}
