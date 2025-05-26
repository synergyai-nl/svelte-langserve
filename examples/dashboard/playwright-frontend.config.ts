import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for frontend-only E2E tests.
 * These tests only require the frontend to be running and don't make backend API calls.
 */
export default defineConfig({
	testDir: 'e2e',
	testMatch: ['**/demo.test.ts'], // Only run frontend tests
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
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: {}
		}
	],
	// Start frontend preview server automatically
	webServer: {
		command: 'npm run preview',
		port: 4173,
		timeout: 120 * 1000,
		reuseExistingServer: !process.env.CI
	}
});
