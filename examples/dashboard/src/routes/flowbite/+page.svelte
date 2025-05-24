<script lang="ts">
	import { LangServeFrontend, ThemeProvider, flowbiteTheme } from 'svelte-langserve';

	const userId = 'demo-user-flowbite';
</script>

<svelte:head>
	<title>Flowbite Theme Demo - LangServe Frontend</title>
	<meta
		name="description"
		content="Demonstration of LangServe Frontend with Flowbite theme integration"
	/>

	<!-- Flowbite CSS -->
	<link
		href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="container mx-auto py-8">
		<div class="mb-8 text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Flowbite Theme Demo</h1>
			<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
				Experience the LangServe Frontend with beautiful Flowbite components. This demo showcases
				how the theme system enables seamless integration with different UI frameworks while
				maintaining all core functionality.
			</p>
		</div>

		<div
			class="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800"
			style="height: 600px;"
		>
			<ThemeProvider theme={flowbiteTheme}>
				<LangServeFrontend {userId} />
			</ThemeProvider>
		</div>

		<div class="mt-8 text-center">
			<div class="mx-auto max-w-4xl">
				<h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
					Theme Features Demonstrated
				</h2>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<div class="mb-2 text-3xl text-blue-600 dark:text-blue-400">🎨</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
							Authentic Flowbite Design
						</h3>
						<p class="text-gray-600 dark:text-gray-400">
							Uses genuine Flowbite component classes for professional appearance
						</p>
					</div>

					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<div class="mb-2 text-3xl text-green-600 dark:text-green-400">🌙</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
							Dark Mode Support
						</h3>
						<p class="text-gray-600 dark:text-gray-400">
							Full dark mode integration with automatic theme switching
						</p>
					</div>

					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<div class="mb-2 text-3xl text-purple-600 dark:text-purple-400">📱</div>
						<h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
							Responsive Layout
						</h3>
						<p class="text-gray-600 dark:text-gray-400">
							Optimized for all screen sizes with Flowbite's responsive utilities
						</p>
					</div>
				</div>

				<div class="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
					<h3 class="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
						Implementation Note
					</h3>
					<p class="text-blue-800 dark:text-blue-200">
						This entire interface is themed using the new <code
							class="rounded bg-blue-100 px-2 py-1 dark:bg-blue-800">ThemeProvider</code
						>
						wrapper around the standard
						<code class="rounded bg-blue-100 px-2 py-1 dark:bg-blue-800">LangServeFrontend</code> component.
						All core LLM functionality remains unchanged.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
