<script lang="ts">
	import {
		conversations,
		activeConversationId,
		setActiveConversationId
	} from '../stores/langserve';
</script>

<div class="mb-4 rounded-lg border border-gray-200 p-4">
	<h3 class="mb-3 text-lg font-semibold">Conversations</h3>

	{#if $conversations.length === 0}
		<div class="py-2 text-sm text-gray-500">No conversations yet</div>
	{:else}
		<div class="space-y-2">
			{#each $conversations as conv (conv.id)}
				<div
					on:click={() => setActiveConversationId(conv.id)}
					on:keydown={(e) => e.key === 'Enter' && setActiveConversationId(conv.id)}
					class="cursor-pointer rounded-md p-2 text-sm {$activeConversationId === conv.id
						? 'bg-blue-100'
						: 'bg-gray-100 hover:bg-gray-200'}"
					tabindex="0"
					role="button"
				>
					<div><strong>ID:</strong> {conv.id.slice(0, 8)}...</div>
					<div>
						<strong>Agents:</strong>
						{conv.participants.agents.map((a) => a.name).join(', ')}
					</div>
					<div><strong>Messages:</strong> {conv.messages.length}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
