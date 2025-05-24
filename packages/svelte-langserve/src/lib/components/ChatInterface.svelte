<script lang="ts">
  import type { Conversation } from '../types.js';
  import ChatMessage from './ChatMessage.svelte';

  let { 
    sendMessage,
    conversation = null,
    isLoading = false,
    oncreate = undefined
  }: {
    sendMessage: (content: string) => void;
    conversation?: Conversation | null;
    isLoading?: boolean;
    oncreate?: (() => void) | undefined;
  } = $props();
  
  let messageInput = $state('');
  let chatContainer: HTMLDivElement;
  
  function handleSendMessage() {
    if (messageInput.trim() && conversation) {
      sendMessage(messageInput.trim());
      messageInput = '';
    }
  }
  
  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }
  
  // Auto-scroll to bottom when new messages arrive
  function scrollToBottom() {
    if (chatContainer) {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 0);
    }
  }
  
  $effect(() => {
    if (conversation) {
      scrollToBottom();
    }
  });
</script>

{#if conversation}
  <div class="flex flex-col h-full">
    <!-- Chat Header -->
    <div class="p-3 border-b bg-gray-50">
      <h3 class="text-lg font-semibold">
        {conversation.title || `Conversation: ${conversation.id.slice(0, 12)}...`}
      </h3>
      <div class="text-sm text-gray-600">
        {conversation.messages.length} messages
      </div>
      {#if isLoading}
        <div class="text-xs text-blue-500 italic mt-1">
          🔄 AI is responding...
        </div>
      {/if}
    </div>
    
    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4" bind:this={chatContainer}>
      {#if conversation.messages.length === 0}
        <div class="text-gray-400 text-center py-4">
          No messages yet. Start the conversation!
        </div>
      {:else}
        {#each conversation.messages as chatMessage (chatMessage.id)}
          <ChatMessage message={{
            id: chatMessage.id,
            role: chatMessage.type === 'human' ? 'user' : chatMessage.type === 'ai' ? 'assistant' : 'system',
            content: typeof chatMessage.content === 'string' ? chatMessage.content : JSON.stringify(chatMessage.content),
            timestamp: new Date(chatMessage.timestamp),
            metadata: {
              endpoint_name: chatMessage.sender_id
            }
          }} />
        {/each}
      {/if}
    </div>
    
    <!-- Input -->
    <div class="p-3 border-t flex">
      <textarea
        class="flex-1 border rounded-md p-2 mr-2 resize-none"
        rows="2"
        bind:value={messageInput}
        on:keydown={handleKeyPress}
        placeholder="Type a message..."
      ></textarea>
      <button
        on:click={handleSendMessage}
        disabled={!messageInput.trim() || isLoading}
        class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center h-full">
    <div class="text-center p-8">
      <h3 class="text-xl font-semibold mb-3">Welcome to LangServe Frontend</h3>
      <p class="text-gray-600 mb-2">Select endpoints and create a conversation to get started.</p>
      <button
        on:click={oncreate}
        class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Create New Conversation
      </button>
    </div>
  </div>
{/if}