<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		change: { temperature: number; streaming: boolean };
	}>();

	export let temperature = 0.7;
	export let streaming = true;

	function updateConfig() {
		dispatch('change', { temperature, streaming });
	}
</script>

<div class="mb-4 rounded-lg border border-gray-200 p-4">
	<h3 class="mb-3 text-lg font-semibold">Configuration</h3>

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
				class="mx-2 flex-1"
			/>
			<span class="text-sm">{temperature}</span>
		</label>
	</div>

	<div>
		<label class="flex items-center">
			<input type="checkbox" bind:checked={streaming} on:change={updateConfig} class="mr-2" />
			<span>Enable Streaming</span>
		</label>
	</div>
</div>
