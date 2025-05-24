<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    change: { temperature: number; streaming: boolean };
  }>();

  let { 
    temperature = 0.7,
    streaming = true
  }: {
    temperature?: number;
    streaming?: boolean;
  } = $props();

  function updateConfig() {
    dispatch('change', { temperature, streaming });
  }
</script>

<div class="p-4 border border-gray-200 rounded-lg mb-4">
  <h3 class="text-lg font-semibold mb-3">Configuration</h3>
  
  <div class="mb-3">
    <label class="flex items-center">
      <span class="mr-2">Temperature:</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        bind:value={temperature}
        on:change={updateConfig}
        class="flex-1 mx-2"
      />
      <span class="text-sm">{temperature}</span>
    </label>
  </div>
  
  <div>
    <label class="flex items-center">
      <input
        type="checkbox"
        bind:checked={streaming}
        on:change={updateConfig}
        class="mr-2"
      />
      <span>Enable Streaming</span>
    </label>
  </div>
</div>