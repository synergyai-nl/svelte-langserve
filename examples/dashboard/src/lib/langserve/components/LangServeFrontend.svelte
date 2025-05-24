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
	import ErrorBoundary from './ErrorBoundary.svelte';

	export let userId: string = 'user123';
	export const authToken: string | undefined = undefined;
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

		// Watch for authentication changes using $effect
		$effect(() => {
			if ($isAuthenticated && $accessToken) {
				const token = $accessToken;
				const user = $currentUser?.username || userId;
				langserveStore.connect(serverUrl, user, token);
			} else {
				langserveStore.disconnect();
			}
		});

		// Initial data loading after langserve authentication using $effect
		$effect(() => {
			if ($authenticated) {
				loadConversations();
				testAllEndpoints();
			}
		});
	});

	onDestroy(() => {
		langserveStore.disconnect();
	});

	function handleConfigChange(data: { temperature: number; streaming: boolean }) {
		config = data;
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

<ErrorBoundary
	fallback="The LangServe Frontend encountered an error. Please try refreshing the page."
	showDetails={true}
	onError={(error) => console.error('LangServe Frontend Error:', error)}
>
	<div class="flex h-screen bg-white">
		<!-- Show login form if not authenticated -->
		{#if !$isAuthenticated}
			<ErrorBoundary fallback="Login form encountered an error.">
				<LoginForm serverUrl={backendUrl} onloginSuccess={handleLoginSuccess} />
			</ErrorBoundary>
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
							onclick={() => {
								const token = $accessToken || undefined;
								const user = $currentUser?.username || userId;
								langserveStore.connect(serverUrl, user, token);
							}}
							class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
						>
							Retry Connection
						</button>
						<button
							onclick={handleLogout}
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
						onclick={handleLogout}
						class="mt-4 rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
					>
						Logout
					</button>
				</div>
			</div>
		{:else}
			<!-- Main interface when connected and authenticated -->
			<ErrorBoundary fallback="Sidebar components encountered an error.">
				<div class="flex w-80 flex-col overflow-y-auto border-r p-4">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-xl font-bold">LangServe Frontend</h2>
						<button
							onclick={handleLogout}
							class="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
						>
							Logout
						</button>
					</div>

					<ErrorBoundary fallback="Endpoint selector error.">
						<EndpointSelector bind:selectedEndpoints />
					</ErrorBoundary>

					<ErrorBoundary fallback="Config panel error.">
						<ConfigPanel
							temperature={config.temperature}
							streaming={config.streaming}
							onchange={handleConfigChange}
						/>
					</ErrorBoundary>

					<button
						onclick={handleCreateConversation}
						disabled={selectedEndpoints.length === 0}
						class="mb-4 w-full py-2 {selectedEndpoints.length > 0
							? 'bg-blue-500 hover:bg-blue-600'
							: 'cursor-not-allowed bg-gray-300'} rounded-md text-white"
					>
						Create Conversation ({selectedEndpoints.length} endpoints)
					</button>

					<ErrorBoundary fallback="Conversation list error.">
						<ConversationList />
					</ErrorBoundary>
				</div>
			</ErrorBoundary>

			<ErrorBoundary fallback="Chat interface encountered an error.">
				<div class="flex flex-1 flex-col">
					<ChatInterface sendMessage={handleSendChatMessage} oncreate={handleCreateConversation} />
				</div>
			</ErrorBoundary>
		{/if}
	</div>
</ErrorBoundary>
