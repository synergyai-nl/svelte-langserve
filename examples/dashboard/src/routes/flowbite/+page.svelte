<script lang="ts">
  import { LangServeFrontend, ThemeProvider, flowbiteTheme } from 'svelte-langserve';
  
  const userId = 'demo-user-flowbite';
</script>

<svelte:head>
  <title>Flowbite Theme Demo - LangServe Frontend</title>
  <meta name="description" content="Demonstration of LangServe Frontend with Flowbite theme integration" />
  
  <!-- Flowbite CSS -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.css" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto py-8">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Flowbite Theme Demo
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Experience the LangServe Frontend with beautiful Flowbite components. 
        This demo showcases how the theme system enables seamless integration 
        with different UI frameworks while maintaining all core functionality.
      </p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden" style="height: 600px;">
      <ThemeProvider theme={flowbiteTheme}>
        <LangServeFrontend {userId} />
      </ThemeProvider>
    </div>
    
    <div class="mt-8 text-center">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Theme Features Demonstrated
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div class="text-blue-600 dark:text-blue-400 text-3xl mb-2">🎨</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Authentic Flowbite Design
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Uses genuine Flowbite component classes for professional appearance
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div class="text-green-600 dark:text-green-400 text-3xl mb-2">🌙</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Dark Mode Support
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Full dark mode integration with automatic theme switching
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div class="text-purple-600 dark:text-purple-400 text-3xl mb-2">📱</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Responsive Layout
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Optimized for all screen sizes with Flowbite's responsive utilities
            </p>
          </div>
        </div>
        
        <div class="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Implementation Note
          </h3>
          <p class="text-blue-800 dark:text-blue-200">
            This entire interface is themed using the new <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">ThemeProvider</code> 
            wrapper around the standard <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">LangServeFrontend</code> component. 
            All core LLM functionality remains unchanged.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>