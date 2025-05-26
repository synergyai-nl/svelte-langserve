import { defineConfig } from '@playwright/test';

/**
 * Main Playwright configuration for full-stack E2E tests.
 * These tests require both frontend and backend services.
 * For CI, these should only run when services are available.
 */
export default defineConfig({
	testDir: 'e2e',
	testIgnore: ['**/demo.test.ts'], // Frontend-only tests use separate config
	timeout: 30000,
	expect: {
		timeout: 10000
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html'], ['list'], ...(process.env.CI ? [['github']] : [])],
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...{} // devices['Desktop Chrome'] - using default for now
			}
		}
	],
	// Automatically start both frontend and backend services
	webServer: [
		{
			command: 'npm run preview',
			port: 4173,
			timeout: 120 * 1000,
			reuseExistingServer: !process.env.CI
		},
		{
			command:
				'TEST_MODE=true OPENAI_API_KEY=test-key-for-mocking ANTHROPIC_API_KEY=test-key-for-mocking uv run uvicorn src.svelte_langgraph.app:create_app --factory --host 0.0.0.0 --port 8000',
			port: 8000,
			timeout: 120 * 1000,
			reuseExistingServer: !process.env.CI,
			cwd: '../langgraph-backend'
		}
	]
});
