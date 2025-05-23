<script lang="ts">
	import LangServeFrontend from '$lib/langserve/components/LangServeFrontend.svelte';
	import { browser } from '$app/environment';

	// Generate a random user ID for demo purposes
	// In a real app, this would come from authentication
	let userId = "";

	if (browser) {
		// Get existing user ID from localStorage or create a new one
		userId =
			localStorage.getItem('langserve_user_id') ||
			`user_${Math.random().toString(36).substring(2, 10)}`;
		localStorage.setItem('langserve_user_id', userId);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-blue-600 p-4 text-white">
		<div class="container mx-auto">
			<h1 class="text-2xl font-bold">Claude Rocks the Dashboard</h1>
			<p class="text-sm opacity-80">LangServe Frontend Implementation in SvelteKit</p>
		</div>
	</header>

	<main class="container mx-auto p-4">
		<div class="h-[calc(100vh-8rem)] overflow-hidden rounded-lg bg-white shadow-md">
			{#if browser && userId}
				<LangServeFrontend
					{userId}
					serverUrl={import.meta.env.VITE_LANGSERVE_SERVER_URL || 'http://localhost:3000'}
					backendUrl={import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}
				/>
			{:else}
				<div class="flex h-full items-center justify-center">
					<p>Loading...</p>
				</div>
			{/if}
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
