<script lang="ts">
  import type { ChatMessage } from '@svelte-langserve/types';

  export let message: ChatMessage;
</script>

<div 
  class="my-3 p-3 rounded-lg {message.sender_type === 'user' ? 'bg-blue-50' : 'bg-gray-50'} 
  {message.additional_kwargs?.streaming ? 'border-l-4 border-blue-400' : ''}"
>
  <div class="font-semibold mb-1">
    {message.sender_type === 'user' ? 'You' : message.additional_kwargs?.endpoint_name || message.sender_id}
    {#if message.additional_kwargs?.streaming}
      <span class="text-blue-500 text-sm italic ml-1">(streaming...)</span>
    {/if}
  </div>
  
  <div class="whitespace-pre-wrap">
    {#if typeof message.content === 'string'}
      {message.content}
    {:else}
      {JSON.stringify(message.content)}
    {/if}
  </div>
  
  <div class="text-xs text-gray-500 mt-1">
    {new Date(message.timestamp).toLocaleTimeString()}
  </div>
</div>