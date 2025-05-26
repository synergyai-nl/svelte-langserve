import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		svelte({ 
			hot: !process.env.VITEST,
			compilerOptions: {
				dev: true,
				hydratable: true
			},
			onwarn: (warning, handler) => {
				// Suppress warnings during testing
				if (warning.code === 'css-unused-selector') return;
				handler?.(warning);
			}
		})
	],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	define: {
		global: 'globalThis',
		'process.browser': true,
		'import.meta.env.SSR': false
	}
});