<script lang="ts">
	import {
		activeConversation,
		hasStreamingMessages,
		getDisplayMessages,
		getMessagePagination,
		loadMoreMessages
	} from '../stores/langserve';
	import ChatMessage from './ChatMessage.svelte';
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import { chatLogger, performanceLogger } from '../../utils/logger';

	export let sendMessage: (content: string) => void;

	let messageInput = '';
	let chatContainer: HTMLDivElement;
	let isLoadingMore = $state(false);

	// Reactive pagination info
	$: pagination = $activeConversation ? getMessagePagination($activeConversation.id) : null;
	$: displayMessages = $activeConversation ? getDisplayMessages($activeConversation.id) : [];

	const dispatch = createEventDispatcher();

	function handleSendMessage() {
		try {
			if (messageInput.trim() && $activeConversation) {
				chatLogger.info('Sending message', {
					conversationId: $activeConversation.id.substring(0, 8) + '...',
					messageLength: messageInput.trim().length
				});
				
				performanceLogger.time('message-send');
				sendMessage(messageInput.trim());
				messageInput = '';
				performanceLogger.timeEnd('message-send');
			}
		} catch (error) {
			chatLogger.error('Error sending message', { error: error.message }, error);
		}
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	}

	// Auto-scroll to bottom when new messages arrive - use afterUpdate instead of reactive statements

	function scrollToBottom() {
		try {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		} catch (error) {
			console.error('Error scrolling to bottom:', error);
		}
	}

	async function handleLoadMore() {
		if (!$activeConversation || !pagination?.hasMore || isLoadingMore) return;
		
		isLoadingMore = true;
		chatLogger.info('Loading more messages', {
			conversationId: $activeConversation.id.substring(0, 8) + '...',
			currentPage: pagination.currentPage
		});
		
		try {
			performanceLogger.time('load-more-messages');
			await loadMoreMessages($activeConversation.id);
			performanceLogger.timeEnd('load-more-messages');
		} catch (error) {
			chatLogger.error('Error loading more messages', { error: error.message }, error);
		} finally {
			isLoadingMore = false;
		}
	}

	// Auto-scroll when messages change
	$effect(() => {
		// Watch displayMessages for changes
		displayMessages;
		scrollToBottom();
	});
</script>

{#if $activeConversation}
	<div class="flex h-full flex-col">
		<!-- Chat Header -->
		<div class="border-b bg-gray-50 p-3">
			<h3 class="text-lg font-semibold">
				Conversation: {$activeConversation.id.slice(0, 12)}...
			</h3>
			<div class="text-sm text-gray-600">
				Agents: {$activeConversation.participants.agents.map((a) => a.name).join(', ')}
			</div>
			{#if $hasStreamingMessages}
				<div class="mt-1 text-xs text-blue-500 italic" transition:slide>
					🔄 Agents are responding...
				</div>
			{/if}
		</div>

		<!-- Messages -->
		<div class="flex-1 overflow-y-auto p-4" bind:this={chatContainer}>
			{#if displayMessages.length === 0}
				<div class="py-4 text-center text-gray-400">No messages yet. Start the conversation!</div>
			{:else}
				<!-- Load More Button -->
				{#if pagination?.hasMore}
					<div class="text-center py-2 mb-4">
						<button
							onclick={handleLoadMore}
							disabled={isLoadingMore}
							class="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoadingMore ? 'Loading older messages...' : `Load older messages (${pagination.totalMessages - displayMessages.length} more)`}
						</button>
					</div>
				{/if}

				<!-- Message List -->
				{#each displayMessages as message (message.id)}
					<ChatMessage {message} />
				{/each}
			{/if}
		</div>

		<!-- Input -->
		<div class="flex border-t p-3">
			<textarea
				class="mr-2 flex-1 resize-none rounded-md border p-2"
				rows="2"
				bind:value={messageInput}
				on:keydown={handleKeyPress}
				placeholder="Type a message..."
			></textarea>
			<button
				on:click={handleSendMessage}
				disabled={!messageInput.trim()}
				class="rounded-md bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-blue-300"
			>
				Send
			</button>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center">
		<div class="p-8 text-center">
			<h3 class="mb-3 text-xl font-semibold">Welcome to LangServe Frontend</h3>
			<p class="mb-2 text-gray-600">Select endpoints and create a conversation to get started.</p>
			<button
				on:click={() => dispatch('create')}
				class="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			>
				Create New Conversation
			</button>
		</div>
	</div>
{/if}
