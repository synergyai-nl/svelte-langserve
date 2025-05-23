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
	import { authStore, isAuthenticated, accessToken, currentUser } from '../stores/auth';

	import EndpointSelector from './EndpointSelector.svelte';
	import ConfigPanel from './ConfigPanel.svelte';
	import ConversationList from './ConversationList.svelte';
	import ChatInterface from './ChatInterface.svelte';
	import LoginForm from './LoginForm.svelte';

	export let userId: string = 'user123';
	export let authToken: string | undefined = undefined;
	export let serverUrl: string = 'http://localhost:3000';
	export let backendUrl: string = 'http://localhost:8000';

	let selectedEndpoints: string[] = [];
	let config = { temperature: 0.7, streaming: true };

	onMount(() => {
		// If already authenticated via auth store, connect immediately
		if ($isAuthenticated && $accessToken) {
			const token = $accessToken;
			const user = $currentUser?.username || userId;
			langserveStore.connect(serverUrl, user, token);
		}

		// Watch for authentication changes
		const unsubscribeAuth = isAuthenticated.subscribe((authenticated) => {
			if (authenticated && $accessToken) {
				const token = $accessToken;
				const user = $currentUser?.username || userId;
				langserveStore.connect(serverUrl, user, token);
			} else {
				langserveStore.disconnect();
			}
		});

		// Initial data loading after langserve authentication
		const unsubscribeLangserve = authenticated.subscribe((value) => {
			if (value) {
				loadConversations();
				testAllEndpoints();
			}
		});

		return () => {
			unsubscribeAuth();
			unsubscribeLangserve();
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

	function handleLoginSuccess() {
		// Connection will be handled automatically by the isAuthenticated subscription
	}

	function handleLogout() {
		authStore.logout();
	}
</script>

<div class="flex h-screen bg-white">
	<!-- Show login form if not authenticated -->
	{#if !$isAuthenticated}
		<LoginForm serverUrl={backendUrl} on:loginSuccess={handleLoginSuccess} />
	<!-- If authenticated but not connected to langserve, show loading state -->
	{:else if !$connected}
		<div class="flex h-full w-full items-center justify-center">
			<div class="p-6 text-center">
				<h2 class="mb-4 text-xl">Connecting to LangServe Frontend...</h2>
				{#if $connectionError}
					<div class="mb-4 text-red-500">
						Error: {$connectionError}
					</div>
				{/if}
				<div class="space-y-2">
					<button
						on:click={() => {
							const token = $accessToken;
							const user = $currentUser?.username || userId;
							langserveStore.connect(serverUrl, user, token);
						}}
						class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Retry Connection
					</button>
					<button
						on:click={handleLogout}
						class="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
					>
						Logout
					</button>
				</div>
			</div>
		</div>
	{:else if !$authenticated}
		<div class="flex h-full w-full items-center justify-center">
			<div class="text-center">
				<h2 class="text-xl">Authenticating with LangServe...</h2>
				<button
					on:click={handleLogout}
					class="mt-4 rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
				>
					Logout
				</button>
			</div>
		</div>
	{:else}
		<!-- Main interface when connected and authenticated -->
		<div class="flex w-80 flex-col overflow-y-auto border-r p-4">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-bold">LangServe Frontend</h2>
				<button
					on:click={handleLogout}
					class="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
				>
					Logout
				</button>
			</div>

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
