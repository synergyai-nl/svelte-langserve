<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		fallback?: string;
		showDetails?: boolean;
		onError?: ((error: Error) => void) | undefined;
	}

	let {
		fallback = 'An error occurred. Please try again.',
		showDetails = false,
		onError = undefined
	}: Props = $props();

	let hasError = $state(false);
	let errorMessage = $state('');
	let errorStack = $state('');

	// Global error handler for unhandled errors
	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			captureError(new Error(event.message), event.filename, event.lineno);
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			captureError(new Error(`Unhandled Promise Rejection: ${event.reason}`), 'Promise', 0);
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	function captureError(error: Error, source?: string, line?: number) {
		hasError = true;
		errorMessage = error.message || 'Unknown error occurred';
		errorStack = error.stack || '';

		// Log error for debugging
		console.error('ErrorBoundary caught error:', {
			message: errorMessage,
			source,
			line,
			stack: errorStack
		});

		// Call custom error handler if provided
		if (onError) {
			onError(error);
		}
	}

	function handleRetry() {
		hasError = false;
		errorMessage = '';
		errorStack = '';
	}

	// Wrap component execution to catch synchronous errors
	function safeExecute<T>(fn: () => T, defaultValue: T): T {
		try {
			return fn();
		} catch (error) {
			captureError(error instanceof Error ? error : new Error(String(error)));
			return defaultValue;
		}
	}

	// Export the safeExecute function for use by child components
	export { safeExecute };
</script>

{#if hasError}
	<div class="error-boundary flex flex-col items-center justify-center p-8 text-center">
		<div class="mb-4 max-w-md rounded-lg border border-red-300 bg-red-50 p-6">
			<div class="mb-4 flex items-center">
				<svg
					class="mr-2 h-6 w-6 text-red-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
					></path>
				</svg>
				<h3 class="text-lg font-semibold text-red-800">Something went wrong</h3>
			</div>

			<p class="mb-4 text-red-700">{fallback}</p>

			{#if showDetails && errorMessage}
				<details class="text-left text-sm">
					<summary class="mb-2 cursor-pointer text-red-600 hover:text-red-800">
						Error details
					</summary>
					<div class="rounded border bg-red-100 p-3 font-mono text-xs text-red-800">
						<p class="mb-1 font-semibold">Message:</p>
						<p class="mb-3">{errorMessage}</p>
						{#if errorStack}
							<p class="mb-1 font-semibold">Stack trace:</p>
							<pre class="max-h-32 overflow-auto whitespace-pre-wrap">{errorStack}</pre>
						{/if}
					</div>
				</details>
			{/if}

			<div class="mt-4 flex gap-2">
				<button
					onclick={handleRetry}
					class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
				>
					Try Again
				</button>
				<button
					onclick={() => window.location.reload()}
					class="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none"
				>
					Reload Page
				</button>
			</div>
		</div>
	</div>
{:else}
	<slot {safeExecute} />
{/if}

<style>
	.error-boundary {
		min-height: 200px;
		background-color: #fef2f2;
	}
</style>
