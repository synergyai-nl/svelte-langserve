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
	// For full-stack tests, services should be managed externally
	// Use the test:e2e:full-stack target or manual service setup
	webServer: undefined
});
