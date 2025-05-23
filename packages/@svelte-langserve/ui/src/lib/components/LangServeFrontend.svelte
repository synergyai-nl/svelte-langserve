<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    langserveStore, connected, authenticated, connectionError, 
    testAllEndpoints, loadConversations, sendMessage
  } from '@svelte-langserve/core';
  
  import EndpointSelector from './EndpointSelector.svelte';
  import ConfigPanel from './ConfigPanel.svelte';
  import ConversationList from './ConversationList.svelte';
  import ChatInterface from './ChatInterface.svelte';
  
  export let userId: string;
  export let authToken: string | undefined = undefined;
  export let serverUrl: string = 'http://localhost:3000';
  
  let selectedEndpoints: string[] = [];
  let config = { temperature: 0.7, streaming: true };

  onMount(() => {
    // Connect to the server
    langserveStore.connect(serverUrl, userId, authToken);
    
    // Initial data loading after authentication
    const unsubscribe = authenticated.subscribe(value => {
      if (value) {
        loadConversations();
        testAllEndpoints();
      }
    });
    
    return () => {
      unsubscribe();
    };
  });
  
  onDestroy(() => {
    langserveStore.disconnect();
  });
  
  function handleConfigChange(event: CustomEvent<{ temperature: number; streaming: boolean }>) {
    config = event.detail;
  }
  
  function handleCreateConversation() {
    if (selectedEndpoints.length > 0) {
      langserveStore.createConversation(selectedEndpoints, undefined, config);
    }
  }
  
  function handleSendChatMessage(content: string) {
    langserveStore.sendMessage($langserveStore.activeConversationId!, content, config);
  }
</script>

<div class="flex h-screen bg-white">
  <!-- If not connected or authenticated, show loading state -->
  {#if !$connected}
    <div class="w-full h-full flex items-center justify-center">
      <div class="text-center p-6">
        <h2 class="text-xl mb-4">Connecting to LangServe Frontend...</h2>
        {#if $connectionError}
          <div class="text-red-500 mb-4">
            Error: {$connectionError}
          </div>
        {/if}
        <button 
          on:click={() => langserveStore.connect(serverUrl, userId, authToken)}
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Retry Connection
        </button>
      </div>
    </div>
  {:else if !$authenticated}
    <div class="w-full h-full flex items-center justify-center">
      <div class="text-center">
        <h2 class="text-xl">Authenticating...</h2>
      </div>
    </div>
  {:else}
    <!-- Main interface when connected and authenticated -->
    <div class="w-80 border-r p-4 overflow-y-auto flex flex-col">
      <h2 class="text-xl font-bold mb-4">LangServe Frontend</h2>
      
      <EndpointSelector let:selectedEndpoints={endpoints}>
        {#if endpoints}
          {@const endpointsList = endpoints}
          {@update selectedEndpoints = endpointsList}
        {/if}
      </EndpointSelector>
      
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
      
      <ConversationList />
    </div>
    
    <div class="flex-1 flex flex-col">
      <ChatInterface 
        sendMessage={handleSendChatMessage}
        on:create={handleCreateConversation}
      />
    </div>
  {/if}
</div>