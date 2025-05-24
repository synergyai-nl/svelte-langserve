<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { useTheme } from '../themes/utils.js';

  const dispatch = createEventDispatcher<{
    change: { temperature: number; streaming: boolean };
  }>();

  const theme = useTheme();

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

<div class={theme.configPanel}>
  <h3 class={theme.configLabel}>Configuration</h3>
  
  <div class={theme.configSection}>
    <label class="flex items-center">
      <span class="mr-2">Temperature:</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        bind:value={temperature}
        on:change={updateConfig}
        class={theme.configSlider}
      />
      <span class="text-sm ml-2">{temperature}</span>
    </label>
  </div>
  
  <div class={theme.configSection}>
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