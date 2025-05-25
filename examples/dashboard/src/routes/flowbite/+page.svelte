<script lang="ts">
	import { LangGraphFrontend, ThemeProvider, flowbiteTheme } from 'svelte-langgraph';
	import { Button, Card, Badge, Alert } from 'flowbite-svelte';
	import { CheckCircleSolid } from 'flowbite-svelte-icons';

	const userId = 'demo-user-flowbite';
</script>

<svelte:head>
	<title>Flowbite Theme Demo - LangGraph Frontend</title>
	<meta
		name="description"
		content="Demonstration of LangGraph Frontend with Flowbite theme integration"
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="container mx-auto py-8">
		<div class="mb-8 text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Flowbite Theme Demo</h1>
			<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
				Experience the LangGraph Frontend with beautiful Flowbite components. This demo showcases
				how the theme system enables seamless integration with different UI frameworks while
				maintaining all core functionality.
			</p>
		</div>

		<div
			class="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800"
			style="height: 600px;"
		>
			<ThemeProvider theme={flowbiteTheme}>
				<LangGraphFrontend {userId} />
			</ThemeProvider>
		</div>

		<div class="mt-8 text-center">
			<div class="mx-auto max-w-4xl">
				<h2 class="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
					Flowbite Components Test
				</h2>

				<Alert class="mb-6">
					{#snippet icon()}<CheckCircleSolid class="h-4 w-4" />{/snippet}
					<span class="font-medium">Success!</span> Flowbite Svelte components are working correctly.
				</Alert>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<Card>
						<div class="mb-2 text-3xl text-blue-600 dark:text-blue-400">🎨</div>
						<h3 class="mb-2 text-lg font-semibold">Authentic Flowbite Design</h3>
						<p class="text-gray-600 dark:text-gray-400">
							Uses genuine Flowbite component classes for professional appearance
						</p>
						<Badge color="blue" class="mt-2">Components</Badge>
					</Card>

					<Card>
						<div class="mb-2 text-3xl text-green-600 dark:text-green-400">🌙</div>
						<h3 class="mb-2 text-lg font-semibold">Dark Mode Support</h3>
						<p class="text-gray-600 dark:text-gray-400">
							Full dark mode integration with automatic theme switching
						</p>
						<Badge color="green" class="mt-2">Theme</Badge>
					</Card>

					<Card>
						<div class="mb-2 text-3xl text-purple-600 dark:text-purple-400">📱</div>
						<h3 class="mb-2 text-lg font-semibold">Responsive Layout</h3>
						<p class="text-gray-600 dark:text-gray-400">
							Optimized for all screen sizes with Flowbite's responsive utilities
						</p>
						<Badge color="purple" class="mt-2">Responsive</Badge>
					</Card>
				</div>

				<div class="mt-8 flex justify-center gap-4">
					<Button color="blue">Primary Button</Button>
					<Button color="alternative">Secondary Button</Button>
					<Button color="green">Success Button</Button>
				</div>

				<Card class="mt-8">
					<h3 class="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
						Implementation Note
					</h3>
					<p class="text-blue-800 dark:text-blue-200">
						This entire interface is themed using the new <code
							class="rounded bg-blue-100 px-2 py-1 dark:bg-blue-800">ThemeProvider</code
						>
						wrapper around the standard
						<code class="rounded bg-blue-100 px-2 py-1 dark:bg-blue-800">LangGraphFrontend</code> component.
						All core LLM functionality remains unchanged.
					</p>
				</Card>
			</div>
		</div>
	</div>
</div>
