<script lang="ts">
  import type { Message } from '../types.js';

  let { message }: { message: Message } = $props();
</script>

<div 
  class="my-3 p-3 rounded-lg {message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'} 
  {message.metadata?.streaming ? 'border-l-4 border-blue-400' : ''}"
>
  <div class="font-semibold mb-1">
    {message.role === 'user' ? 'You' : message.metadata?.assistant_name || message.id}
    {#if message.metadata?.streaming}
      <span class="text-blue-500 text-sm italic ml-1">(streaming...)</span>
    {/if}
  </div>
  
  <div class="whitespace-pre-wrap">
    {message.content}
  </div>
  
  <div class="text-xs text-gray-500 mt-1">
    {message.timestamp.toLocaleTimeString()}
  </div>
</div>