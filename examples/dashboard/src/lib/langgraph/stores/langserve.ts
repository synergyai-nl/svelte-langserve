// Use consolidated package instead of duplicate implementation
export * from 'svelte-langgraph/stores';

// Re-export specific functions for backward compatibility
export {
	langgraphStore as langserveStore,
	connect,
	disconnect,
	createConversation,
	sendMessage,
	loadConversations,
	setActiveConversationId,
	testAssistant as testEndpoint,
	getAssistantSchemas as getEndpointSchemas,
	testAllAssistants as testAllEndpoints,
	joinConversation,
	getConversationHistory,
	updateMessagePagination,
	loadMoreMessages,
	// Derived stores
	connected,
	authenticated,
	connectionError,
	availableAssistants as availableEndpoints,
	conversations,
	activeConversationId,
	streamingMessages,
	hasStreamingMessages,
	assistantHealth as endpointHealth,
	activeConversation,
	// Helper functions
	getDisplayMessages,
	getMessagePagination
} from 'svelte-langgraph/stores';
