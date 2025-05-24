// Use consolidated package instead of duplicate implementation
export * from 'svelte-langserve/stores';

// Re-export specific functions for backward compatibility
export { 
  langserveStore,
  connect,
  disconnect,
  createConversation,
  sendMessage,
  loadConversations,
  setActiveConversationId,
  testEndpoint,
  getEndpointSchemas,
  testAllEndpoints,
  joinConversation,
  getConversationHistory,
  updateMessagePagination,
  loadMoreMessages,
  // Derived stores
  connected,
  authenticated,
  connectionError,
  availableEndpoints,
  conversations,
  activeConversationId,
  streamingMessages,
  hasStreamingMessages,
  endpointHealth,
  activeConversation,
  // Helper functions
  getDisplayMessages,
  getMessagePagination
} from 'svelte-langserve/stores';