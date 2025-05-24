<script lang="ts">
  import type { Conversation } from '../types.js';
  import ChatMessage from './ChatMessage.svelte';
  import { useTheme } from '../themes/utils.js';

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
  
  const theme = useTheme();
  
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
  <div class={theme.chatArea}>
    <!-- Chat Header -->
    <div class={theme.header}>
      <h3 class={theme.title}>
        {conversation.title || `Conversation: ${conversation.id.slice(0, 12)}...`}
      </h3>
      <div class={theme.subtitle}>
        {conversation.messages.length} messages
      </div>
      {#if isLoading}
        <div class={theme.loading}>
          <span class={theme.loadingSpinner}>🔄</span>
          <span class={theme.loadingText}>AI is responding...</span>
        </div>
      {/if}
    </div>
    
    <!-- Messages -->
    <div class={theme.messageContainer} bind:this={chatContainer}>
      {#if conversation.messages.length === 0}
        <div class={theme.emptyState}>
          <div class={theme.emptyStateDescription}>
            No messages yet. Start the conversation!
          </div>
        </div>
      {:else}
        {#each conversation.messages as chatMessage (chatMessage.id)}
          <div class={theme.messageWrapper}>
            {#if chatMessage.type === 'human'}
              <div class={theme.messageUser}>
                <div class={theme.messageUserBubble}>
                  <div class={theme.messageContent}>
                    {typeof chatMessage.content === 'string' ? chatMessage.content : JSON.stringify(chatMessage.content)}
                  </div>
                  <div class={theme.messageTimestamp}>
                    {new Date(chatMessage.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            {:else if chatMessage.type === 'ai'}
              <div class={theme.messageAssistant}>
                <div class={theme.messageAssistantBubble}>
                  <div class={theme.messageContent}>
                    {typeof chatMessage.content === 'string' ? chatMessage.content : JSON.stringify(chatMessage.content)}
                  </div>
                  <div class={theme.messageTimestamp}>
                    {new Date(chatMessage.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            {:else}
              <div class={theme.messageSystem}>
                <div class={theme.messageContent}>
                  {typeof chatMessage.content === 'string' ? chatMessage.content : JSON.stringify(chatMessage.content)}
                </div>
                <div class={theme.messageTimestamp}>
                  {new Date(chatMessage.timestamp).toLocaleTimeString()}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
    
    <!-- Input -->
    <div class={theme.inputContainer}>
      <div class={theme.inputWrapper}>
        <textarea
          class={theme.inputField}
          rows="2"
          bind:value={messageInput}
          on:keydown={handleKeyPress}
          placeholder="Type a message..."
        ></textarea>
        <button
          on:click={handleSendMessage}
          disabled={!messageInput.trim() || isLoading}
          class={!messageInput.trim() || isLoading ? theme.sendButtonDisabled : theme.sendButton}
        >
          Send
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class={theme.emptyState}>
    <div class={theme.emptyStateTitle}>Welcome to LangServe Frontend</div>
    <div class={theme.emptyStateDescription}>Select endpoints and create a conversation to get started.</div>
    <button
      on:click={oncreate}
      class={theme.emptyStateAction}
    >
      Create New Conversation
    </button>
  </div>
{/if}