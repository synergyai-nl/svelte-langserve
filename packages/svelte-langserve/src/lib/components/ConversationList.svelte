<script lang="ts">
  import type { Conversation } from '@svelte-langserve/types';

  export let conversations: Conversation[] = [];
  export let activeConversationId: string | null = null;
  export let onSelect: (conversationId: string) => void = () => {};
</script>

<div class="p-4 border border-gray-200 rounded-lg mb-4">
  <h3 class="text-lg font-semibold mb-3">Conversations</h3>
  
  {#if conversations.length === 0}
    <div class="text-gray-500 text-sm py-2">No conversations yet</div>
  {:else}
    <div class="space-y-2">
      {#each conversations as conv (conv.id)}
        <div
          on:click={() => onSelect(conv.id)}
          on:keydown={(e) => e.key === 'Enter' && onSelect(conv.id)}
          class="p-2 rounded-md text-sm cursor-pointer {activeConversationId === conv.id ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'}"
          tabindex="0"
          role="button"
        >
          <div><strong>ID:</strong> {conv.id.slice(0, 8)}...</div>
          <div><strong>Title:</strong> {conv.title || 'Untitled'}</div>
          <div><strong>Messages:</strong> {conv.messages.length}</div>
          <div class="text-xs text-gray-500">
            Created: {conv.createdAt.toLocaleDateString()}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>