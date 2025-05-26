<script lang="ts">
  import type { LangServeEndpoint, Conversation, ChatMessage } from '../types.js';
  
  import EndpointSelector from './EndpointSelector.svelte';
  import ConfigPanel from './ConfigPanel.svelte';
  import ConversationList from './ConversationList.svelte';
  import ChatInterface from './ChatInterface.svelte';
  import { useTheme } from '../themes/utils.js';
  
  let { 
    userId,
    authToken: _authToken = undefined,
    serverUrl: _serverUrl = 'http://localhost:3000'
  }: {
    userId: string;
    authToken?: string | undefined;
    serverUrl?: string;
  } = $props();
  
  const theme = useTheme();
  
  // Sample data for demonstration
  let endpoints: LangServeEndpoint[] = [
    { id: 'chatbot', name: 'General Chatbot', url: 'http://localhost:8000/chatbot', type: 'chatbot' },
    { id: 'code', name: 'Code Assistant', url: 'http://localhost:8000/code', type: 'code-assistant' }
  ];
  
  let conversations: Conversation[] = $state([]);
  let selectedEndpoints: string[] = $state([]);
  let activeConversationId: string | null = $state(null);
  let config = $state({ temperature: 0.7, streaming: true });
  let _isConnected = false;
  let isLoading = $state(false);

  // Get active conversation
  let activeConversation = $derived(conversations.find(c => c.id === activeConversationId) || null);
  
  function handleEndpointSelectionChange(selected: string[]) {
    selectedEndpoints = selected;
  }
  
  function handleConfigChange(event: CustomEvent<{ temperature: number; streaming: boolean }>) {
    config = event.detail;
  }
  
  function handleCreateConversation() {
    if (selectedEndpoints.length > 0) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: `Conversation with ${selectedEndpoints.length} endpoint(s)`,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        participants: {
          users: [userId],
          assistants: []
        },
        status: 'active'
      };
      conversations = [...conversations, newConversation];
      activeConversationId = newConversation.id;
    }
  }
  
  function handleSendChatMessage(content: string) {
    if (activeConversation) {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'human',
        content,
        sender_id: userId,
        sender_type: 'user',
        timestamp: new Date().toISOString(),
        conversation_id: activeConversation.id
      };
      
      // Update conversation messages
      const updatedConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, userMessage]
      };
      conversations = conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c);
      
      // Simulate AI response
      isLoading = true;
      setTimeout(() => {
        if (activeConversation) {
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: `Echo: ${content}`,
            sender_id: selectedEndpoints[0] || 'assistant',
            sender_type: 'agent',
            timestamp: new Date().toISOString(),
            conversation_id: activeConversation.id
          };
          // Update conversation messages
          const updatedConversation = {
            ...activeConversation,
            messages: [...activeConversation.messages, aiMessage]
          };
          conversations = conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c);
        }
        isLoading = false;
      }, 1000);
    }
  }
  
  function handleConversationSelect(conversationId: string) {
    activeConversationId = conversationId;
  }
  
  function handleTestEndpoint(endpointId: string) {
    console.log('Testing endpoint:', endpointId);
  }
  
  function handleGetSchemas(endpointId: string) {
    console.log('Getting schemas for endpoint:', endpointId);
  }
</script>

<div class={theme.container}>
  <!-- Sidebar -->
  <div class={theme.sidebar}>
    <h2 class={theme.title}>LangServe Frontend</h2>
    
    <EndpointSelector 
      {endpoints}
      {selectedEndpoints}
      onSelectionChange={handleEndpointSelectionChange}
      onTest={handleTestEndpoint}
      onGetSchemas={handleGetSchemas}
    />
    
    <ConfigPanel 
      temperature={config.temperature} 
      streaming={config.streaming} 
      on:change={handleConfigChange} 
    />
    
    <button
      onclick={handleCreateConversation}
      disabled={selectedEndpoints.length === 0}
      class={selectedEndpoints.length > 0 ? theme.createConversationButton : theme.sendButtonDisabled}
    >
      Create Conversation ({selectedEndpoints.length} endpoints)
    </button>
    
    <ConversationList 
      {conversations}
      {activeConversationId}
      onSelect={handleConversationSelect}
    />
  </div>
  
  <!-- Chat Area -->
  <ChatInterface 
    sendMessage={handleSendChatMessage}
    conversation={activeConversation}
    isLoading={isLoading}
    oncreate={handleCreateConversation}
  />
</div>