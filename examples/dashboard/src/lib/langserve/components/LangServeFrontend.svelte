<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		langserveStore,
		connected,
		authenticated,
		connectionError,
		testAllEndpoints,
		loadConversations
	} from '../stores/langserve';

	import EndpointSelector from './EndpointSelector.svelte';
	import ConfigPanel from './ConfigPanel.svelte';
	import ConversationList from './ConversationList.svelte';
	import ChatInterface from './ChatInterface.svelte';

	export let userId: string;
	export let authToken: string | undefined = undefined;
	export let serverUrl: string = 'http://localhost:3000';

	let selectedEndpoints: string[] = [];
	let config = { temperature: 0.7, streaming: true };

	onMount(() => {
		// Connect to the server
		langserveStore.connect(serverUrl, userId, authToken);

		// Initial data loading after authentication
		const unsubscribe = authenticated.subscribe((value) => {
			if (value) {
				loadConversations();
				testAllEndpoints();
			}
		});

		return () => {
			unsubscribe();
		};
	});

	onDestroy(() => {
		langserveStore.disconnect();
	});

	function handleConfigChange(event: CustomEvent<{ temperature: number; streaming: boolean }>) {
		config = event.detail;
	}

	function handleCreateConversation() {
		if (selectedEndpoints.length > 0) {
			langserveStore.createConversation(selectedEndpoints, undefined, config);
		}
	}

	function handleSendChatMessage(content: string) {
		langserveStore.sendMessage($langserveStore.activeConversationId!, content, config);
	}
</script>

<div class="flex h-screen bg-white">
	<!-- If not connected or authenticated, show loading state -->
	{#if !$connected}
		<div class="flex h-full w-full items-center justify-center">
			<div class="p-6 text-center">
				<h2 class="mb-4 text-xl">Connecting to LangServe Frontend...</h2>
				{#if $connectionError}
					<div class="mb-4 text-red-500">
						Error: {$connectionError}
					</div>
				{/if}
				<button
					on:click={() => langserveStore.connect(serverUrl, userId, authToken)}
					class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				>
					Retry Connection
				</button>
			</div>
		</div>
	{:else if !$authenticated}
		<div class="flex h-full w-full items-center justify-center">
			<div class="text-center">
				<h2 class="text-xl">Authenticating...</h2>
			</div>
		</div>
	{:else}
		<!-- Main interface when connected and authenticated -->
		<div class="flex w-80 flex-col overflow-y-auto border-r p-4">
			<h2 class="mb-4 text-xl font-bold">LangServe Frontend</h2>

			<EndpointSelector bind:selectedEndpoints />

			<ConfigPanel
				temperature={config.temperature}
				streaming={config.streaming}
				on:change={handleConfigChange}
			/>

			<button
				on:click={handleCreateConversation}
				disabled={selectedEndpoints.length === 0}
				class="mb-4 w-full py-2 {selectedEndpoints.length > 0
					? 'bg-blue-500 hover:bg-blue-600'
					: 'cursor-not-allowed bg-gray-300'} rounded-md text-white"
			>
				Create Conversation ({selectedEndpoints.length} endpoints)
			</button>

			<ConversationList />
		</div>

		<div class="flex flex-1 flex-col">
			<ChatInterface sendMessage={handleSendChatMessage} on:create={handleCreateConversation} />
		</div>
	{/if}
</div>
