<script lang="ts">
	interface Props {
		temperature?: number;
		streaming?: boolean;
		onchange?: (event: { temperature: number; streaming: boolean }) => void;
	}

	let { temperature = 0.7, streaming = true, onchange }: Props = $props();

	function updateConfig() {
		onchange?.({ temperature, streaming });
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
				onchange={updateConfig}
				class="mx-2 flex-1"
			/>
			<span class="text-sm">{temperature}</span>
		</label>
	</div>

	<div>
		<label class="flex items-center">
			<input type="checkbox" bind:checked={streaming} onchange={updateConfig} class="mr-2" />
			<span>Enable Streaming</span>
		</label>
	</div>
</div>
