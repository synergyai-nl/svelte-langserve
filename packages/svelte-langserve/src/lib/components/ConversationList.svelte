<script lang="ts">
  import type { Conversation } from '../types.js';
  import { useTheme } from '../themes/utils.js';

  let { 
    conversations = [],
    activeConversationId = null,
    onSelect = () => {}
  }: {
    conversations?: Conversation[];
    activeConversationId?: string | null;
    onSelect?: (conversationId: string) => void;
  } = $props();

  const theme = useTheme();
</script>

<div class={theme.conversationList}>
  <h3 class={theme.configLabel}>Conversations</h3>
  
  {#if conversations.length === 0}
    <div class={theme.emptyStateDescription}>No conversations yet</div>
  {:else}
    <div class="space-y-1">
      {#each conversations as conv (conv.id)}
        <div
          on:click={() => onSelect(conv.id)}
          on:keydown={(e) => e.key === 'Enter' && onSelect(conv.id)}
          class={activeConversationId === conv.id ? theme.conversationItemActive : theme.conversationItem}
          tabindex="0"
          role="button"
        >
          <div class={theme.conversationTitle}>{conv.title || `Conversation ${conv.id.slice(0, 8)}...`}</div>
          <div class={theme.conversationPreview}>{conv.messages.length} messages</div>
          <div class={theme.conversationTimestamp}>
            {new Date(conv.createdAt).toLocaleDateString()}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>