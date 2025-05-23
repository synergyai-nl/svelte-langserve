<script lang="ts">
  import { conversations, activeConversationId, setActiveConversationId } from '@svelte-langserve/core';
</script>

<div class="p-4 border border-gray-200 rounded-lg mb-4">
  <h3 class="text-lg font-semibold mb-3">Conversations</h3>
  
  {#if $conversations.length === 0}
    <div class="text-gray-500 text-sm py-2">No conversations yet</div>
  {:else}
    <div class="space-y-2">
      {#each $conversations as conv (conv.id)}
        <div
          on:click={() => setActiveConversationId(conv.id)}
          on:keydown={(e) => e.key === 'Enter' && setActiveConversationId(conv.id)}
          class="p-2 rounded-md text-sm cursor-pointer {$activeConversationId === conv.id ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'}"
          tabindex="0"
          role="button"
        >
          <div><strong>ID:</strong> {conv.id.slice(0, 8)}...</div>
          <div><strong>Agents:</strong> {conv.participants.agents.map(a => a.name).join(', ')}</div>
          <div><strong>Messages:</strong> {conv.messages.length}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>