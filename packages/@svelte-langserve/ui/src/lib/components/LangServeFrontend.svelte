<script lang="ts">
  import type { LangServeEndpoint, Conversation } from '@svelte-langserve/types';
  
  import EndpointSelector from './EndpointSelector.svelte';
  import ConfigPanel from './ConfigPanel.svelte';
  import ConversationList from './ConversationList.svelte';
  import ChatInterface from './ChatInterface.svelte';
  
  export let userId: string;
  export let authToken: string | undefined = undefined;
  export let serverUrl: string = 'http://localhost:3000';
  
  // Sample data for demonstration
  let endpoints: LangServeEndpoint[] = [
    { id: 'chatbot', name: 'General Chatbot', url: 'http://localhost:8000/chatbot', type: 'chatbot' },
    { id: 'code', name: 'Code Assistant', url: 'http://localhost:8000/code', type: 'code-assistant' }
  ];
  
  let conversations: Conversation[] = [];
  let selectedEndpoints: string[] = [];
  let activeConversationId: string | null = null;
  let config = { temperature: 0.7, streaming: true };
  let _isConnected = false;
  let isLoading = false;

  // Get active conversation
  $: activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  
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
        createdAt: new Date(),
        updatedAt: new Date()
      };
      conversations = [...conversations, newConversation];
      activeConversationId = newConversation.id;
    }
  }
  
  function handleSendChatMessage(content: string) {
    if (activeConversation) {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        content,
        role: 'user' as const,
        timestamp: new Date(),
        conversationId: activeConversation.id
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
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            content: `Echo: ${content}`,
            role: 'assistant' as const,
            timestamp: new Date(),
            conversationId: activeConversation.id
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

<div class="flex h-screen bg-white">
  <!-- Main interface -->
  <div class="w-80 border-r p-4 overflow-y-auto flex flex-col">
    <h2 class="text-xl font-bold mb-4">LangServe Frontend</h2>
    
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
      on:click={handleCreateConversation}
      disabled={selectedEndpoints.length === 0}
      class="w-full py-2 mb-4 {selectedEndpoints.length > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'} text-white rounded-md"
    >
      Create Conversation ({selectedEndpoints.length} endpoints)
    </button>
    
    <ConversationList 
      {conversations}
      {activeConversationId}
      onSelect={handleConversationSelect}
    />
  </div>
  
  <div class="flex-1 flex flex-col">
    <ChatInterface 
      sendMessage={handleSendChatMessage}
      conversation={activeConversation}
      isLoading={isLoading}
      oncreate={handleCreateConversation}
    />
  </div>
</div>