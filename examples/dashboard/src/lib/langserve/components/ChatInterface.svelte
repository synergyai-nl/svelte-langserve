<script lang="ts">
	import {
		activeConversation,
		hasStreamingMessages,
		getDisplayMessages
	} from '../stores/langserve';
	import ChatMessage from './ChatMessage.svelte';
	import { createEventDispatcher, afterUpdate } from 'svelte';
	import { slide } from 'svelte/transition';

	export let sendMessage: (content: string) => void;

	let messageInput = '';
	let chatContainer: HTMLDivElement;

	const dispatch = createEventDispatcher();

	function handleSendMessage() {
		if (messageInput.trim() && $activeConversation) {
			sendMessage(messageInput.trim());
			messageInput = '';
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
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	afterUpdate(() => {
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
			{#if getDisplayMessages($activeConversation.id).length === 0}
				<div class="py-4 text-center text-gray-400">No messages yet. Start the conversation!</div>
			{:else}
				{#each getDisplayMessages($activeConversation.id) as message (message.id)}
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
