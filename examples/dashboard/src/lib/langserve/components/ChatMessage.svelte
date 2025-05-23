<script lang="ts">
	import type { ChatMessage } from '../types';

	export let message: ChatMessage;
</script>

<div
	class="my-3 rounded-lg p-3 {message.sender_type === 'user' ? 'bg-blue-50' : 'bg-gray-50'} 
  {message.additional_kwargs?.streaming ? 'border-l-4 border-blue-400' : ''}"
>
	<div class="mb-1 font-semibold">
		{message.sender_type === 'user'
			? 'You'
			: message.additional_kwargs?.endpoint_name || message.sender_id}
		{#if message.additional_kwargs?.streaming}
			<span class="ml-1 text-sm text-blue-500 italic">(streaming...)</span>
		{/if}
	</div>

	<div class="whitespace-pre-wrap">
		{#if typeof message.content === 'string'}
			{message.content}
		{:else}
			{JSON.stringify(message.content)}
		{/if}
	</div>

	<div class="mt-1 text-xs text-gray-500">
		{new Date(message.timestamp).toLocaleTimeString()}
	</div>
</div>
