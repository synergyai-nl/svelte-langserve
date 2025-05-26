<script lang="ts">
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import {
		connect,
		disconnect,
		createConversation,
		sendMessage,
		availableAssistants,
		conversations,
		activeConversation,
		connected,
		authenticated,
		connectionError,
		streamingMessages,
		assistantHealth,
		getDisplayMessages,
		setActiveConversationId
	} from '$lib/langgraph/stores/langserve';
	import { Card, Badge, Spinner, Button } from 'flowbite-svelte';
	import { PaperPlaneSolid, UserSolid, ExclamationCircleSolid } from 'flowbite-svelte-icons';

	// Generate a random user ID for demo purposes
	let userId = '';
	let selectedAssistants: string[] = [];
	let messageInput = '';
	let config = { temperature: 0.7, streaming: true };

	if (browser) {
		userId =
			localStorage.getItem('langgraph_user_id') ||
			`user_${Math.random().toString(36).substring(2, 10)}`;
		localStorage.setItem('langgraph_user_id', userId);
	}

	// Auto-connect when component mounts
	onMount(() => {
		if (browser && userId) {
			// Connect to the SvelteKit server (with Socket.IO), not the Python backend
			// Use PUBLIC_SOCKET_IO_URL if available, otherwise fallback to window.location.origin
			const socketUrl = env.PUBLIC_SOCKET_IO_URL || window.location.origin;
			connect(socketUrl, userId);
		}

		return () => {
			disconnect();
		};
	});

	function handleCreateConversation() {
		console.log('Create conversation clicked!', {
			selectedAssistants,
			authenticated: $authenticated,
			config
		});
		if (selectedAssistants.length > 0) {
			createConversation(selectedAssistants, undefined, config);
		}
	}

	function handleSendMessage() {
		if (messageInput.trim() && $activeConversation) {
			sendMessage($activeConversation.id, messageInput.trim(), config);
			messageInput = '';
		}
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	}

	function toggleAssistant(assistantId: string) {
		if (selectedAssistants.includes(assistantId)) {
			selectedAssistants = selectedAssistants.filter((id) => id !== assistantId);
		} else {
			selectedAssistants = [...selectedAssistants, assistantId];
		}
	}

	// Get display messages with streaming content
	$: displayMessages = $activeConversation ? getDisplayMessages($activeConversation.id) : [];
	$: hasStreamingContent = $streamingMessages.length > 0;
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<header class="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white shadow-lg">
		<div class="container mx-auto">
			<h1 class="text-3xl font-bold">Claude Rocks the Dashboard</h1>
			<p class="text-sm opacity-90">LangGraph Frontend Implementation in SvelteKit</p>
			<div class="mt-2 flex items-center gap-4 text-sm">
				<Badge color={$connected ? 'green' : 'red'} class="flex items-center gap-1">
					<div class="h-2 w-2 rounded-full bg-current"></div>
					{$connected ? 'Connected' : 'Disconnected'}
				</Badge>
				{#if $authenticated}
					<Badge color="blue">Authenticated</Badge>
				{/if}
			</div>
		</div>
	</header>

	<main class="container mx-auto p-4">
		<div class="grid h-[calc(100vh-10rem)] grid-cols-1 gap-6 lg:grid-cols-4">
			<!-- Sidebar -->
			<div class="lg:col-span-1">
				<Card class="h-full overflow-y-auto">
					<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
						LangGraph Frontend
					</h2>

					{#if $connectionError}
						<div
							class="mb-4 flex items-center rounded-lg border border-red-400 bg-red-100 p-4 text-red-700"
						>
							<ExclamationCircleSolid class="mr-2 h-4 w-4" />
							<span class="font-medium">Connection Error:</span>
							{$connectionError}
						</div>
					{/if}

					<!-- Available Assistants -->
					<div class="mb-6">
						<h3 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">
							Available Assistants
						</h3>
						{#if $availableAssistants.length > 0}
							<div class="space-y-2">
								{#each $availableAssistants as assistant (assistant.id)}
									<label
										class="flex cursor-pointer items-center rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
										class:bg-blue-50={selectedAssistants.includes(assistant.id)}
										class:border-blue-500={selectedAssistants.includes(assistant.id)}
									>
										<input
											type="checkbox"
											class="mr-3"
											checked={selectedAssistants.includes(assistant.id)}
											onchange={() => toggleAssistant(assistant.id)}
										/>
										<div class="flex-1">
											<div class="font-medium text-gray-900 dark:text-white">{assistant.name}</div>
											<div class="text-sm text-gray-500 dark:text-gray-400">
												Type: {assistant.type || 'chatbot'}
											</div>
											{#if assistant.description}
												<div class="mt-1 text-xs text-gray-400 dark:text-gray-500">
													{assistant.description}
												</div>
											{/if}
											{#if assistant.assistantId}
												<div class="mt-1 text-xs text-blue-600 dark:text-blue-400">
													ID: {assistant.assistantId}
												</div>
											{/if}
											<div class="mt-2 flex gap-1">
												{#if assistant.type === 'code-assistant'}
													<span class="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800"
														>Code</span
													>
												{:else if assistant.type === 'data-analyst'}
													<span class="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
														>Data</span
													>
												{:else if assistant.type === 'creative-writer'}
													<span class="rounded-full bg-pink-100 px-2 py-1 text-xs text-pink-800"
														>Creative</span
													>
												{:else if assistant.type === 'research-assistant'}
													<span class="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-800"
														>Research</span
													>
												{:else}
													<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800"
														>Chat</span
													>
												{/if}
											</div>
										</div>
										<div
											class="h-3 w-3 rounded-full"
											class:bg-green-500={$assistantHealth.get(assistant.id) !== false}
											class:bg-red-500={$assistantHealth.get(assistant.id) === false}
											class:bg-gray-400={$assistantHealth.get(assistant.id) === undefined}
											title={$assistantHealth.get(assistant.id) === false
												? 'Unhealthy'
												: $assistantHealth.get(assistant.id) === true
													? 'Healthy'
													: 'Unknown'}
										></div>
									</label>
								{/each}
							</div>
						{:else}
							<div class="py-4 text-center text-gray-500 dark:text-gray-400">
								{#if !$connected}
									<Spinner class="mr-2" size="4" />
									Connecting...
								{:else}
									No assistants available
								{/if}
							</div>
						{/if}
					</div>

					<!-- Configuration -->
					<div class="mb-6">
						<h3 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">Configuration</h3>
						<div class="space-y-3">
							<div>
								<label
									for="temperature-slider"
									class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Temperature: {config.temperature}
								</label>
								<input
									id="temperature-slider"
									type="range"
									min="0"
									max="1"
									step="0.1"
									bind:value={config.temperature}
									class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
								/>
							</div>
							<label class="flex items-center">
								<input type="checkbox" bind:checked={config.streaming} class="mr-2" />
								<span class="text-sm text-gray-700 dark:text-gray-300">Enable Streaming</span>
							</label>
						</div>
					</div>

					<!-- Create Conversation -->
					<button
						onclick={handleCreateConversation}
						disabled={selectedAssistants.length === 0 || !$authenticated}
						class="mb-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Create Conversation ({selectedAssistants.length} assistants)
					</button>

					<!-- Conversations List -->
					<div>
						<h3 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">Conversations</h3>
						{#if $conversations.length > 0}
							<div class="space-y-2">
								{#each $conversations as conversation (conversation.id)}
									<button
										class="w-full rounded-lg border p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
										class:bg-blue-50={$activeConversation?.id === conversation.id}
										class:border-blue-500={$activeConversation?.id === conversation.id}
										onclick={() => setActiveConversationId(conversation.id)}
									>
										<div class="font-medium text-gray-900 dark:text-white">
											{conversation.title || `Conversation ${conversation.id.slice(0, 8)}...`}
										</div>
										<div class="text-sm text-gray-500 dark:text-gray-400">
											{conversation.messages.length} messages
										</div>
										<div class="text-xs text-gray-400 dark:text-gray-500">
											{new Date(conversation.createdAt).toLocaleDateString()}
										</div>
									</button>
								{/each}
							</div>
						{:else}
							<div class="py-4 text-center text-gray-500 dark:text-gray-400">
								No conversations yet
							</div>
						{/if}
					</div>
				</Card>
			</div>

			<!-- Chat Area -->
			<div class="lg:col-span-3">
				<Card class="flex h-full flex-col">
					{#if $activeConversation}
						<!-- Chat Header -->
						<div class="border-b bg-gray-50 p-4 dark:bg-gray-800">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
								{$activeConversation.title ||
									`Conversation with ${$activeConversation.participants.assistants.length} assistant(s)`}
							</h3>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								{displayMessages.length} messages
								{#if hasStreamingContent}
									<span class="ml-2 text-blue-600 dark:text-blue-400">
										<Spinner class="mr-1 inline" size="4" />
										AI is responding...
									</span>
								{/if}
							</div>
						</div>

						<!-- Messages -->
						<div class="flex-1 space-y-4 overflow-y-auto p-4">
							{#if displayMessages.length === 0}
								<div class="py-8 text-center text-gray-500 dark:text-gray-400">
									<div class="mb-2 text-lg">No messages yet. Start the conversation!</div>
								</div>
							{:else}
								{#each displayMessages as message (message.id)}
									<div class="flex items-start space-x-3">
										{#if message.type === 'human'}
											<div class="flex-shrink-0">
												<UserSolid class="h-8 w-8 text-blue-600 dark:text-blue-400" />
											</div>
											<div class="flex-1">
												<div class="max-w-lg rounded-lg rounded-tl-none bg-blue-600 p-3 text-white">
													<div class="whitespace-pre-wrap">
														{typeof message.content === 'string'
															? message.content
															: JSON.stringify(message.content)}
													</div>
												</div>
												<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
													{new Date(message.timestamp).toLocaleTimeString()}
												</div>
											</div>
										{:else}
											<div class="flex-shrink-0">
												<div
													class="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white dark:bg-green-400"
												>
													AI
												</div>
											</div>
											<div class="flex-1">
												<div
													class="max-w-lg rounded-lg rounded-tl-none bg-gray-100 p-3 text-gray-900 dark:bg-gray-700 dark:text-white"
												>
													<div class="whitespace-pre-wrap">
														{typeof message.content === 'string'
															? message.content
															: JSON.stringify(message.content)}
														{#if message.additional_kwargs?.streaming}
															<span class="ml-1 inline-block h-4 w-2 animate-pulse bg-current"
															></span>
														{/if}
													</div>
												</div>
												<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
													{message.additional_kwargs?.assistant_name || message.sender_id} •
													{new Date(message.timestamp).toLocaleTimeString()}
												</div>
											</div>
										{/if}
									</div>
								{/each}
							{/if}
						</div>

						<!-- Message Input -->
						<div class="border-t bg-gray-50 p-4 dark:bg-gray-800">
							<div class="flex space-x-3">
								<textarea
									class="flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
									rows={2}
									bind:value={messageInput}
									onkeydown={handleKeyPress}
									placeholder="Type a message..."
									disabled={!$authenticated || hasStreamingContent}
								></textarea>
								<Button
									onclick={handleSendMessage}
									disabled={!messageInput.trim() || !$authenticated || hasStreamingContent}
									color="blue"
									class="self-end"
								>
									<PaperPlaneSolid class="h-5 w-5" />
								</Button>
							</div>
						</div>
					{:else}
						<!-- Empty State -->
						<div class="flex flex-1 items-center justify-center">
							<div class="text-center">
								<div class="mb-2 text-lg font-medium text-gray-900 dark:text-white">
									Welcome to LangGraph Frontend
								</div>
								<div class="mb-4 text-gray-500 dark:text-gray-400">
									Select assistants and create a conversation to get started.
								</div>
								<Button
									onclick={handleCreateConversation}
									disabled={selectedAssistants.length === 0 || !$authenticated}
									color="blue"
								>
									Create New Conversation
								</Button>
							</div>
						</div>
					{/if}
				</Card>
			</div>
		</div>
	</main>
</div>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}
</style>
