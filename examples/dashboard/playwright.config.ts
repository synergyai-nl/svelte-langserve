import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	timeout: 30000, // 30 second timeout for each test
	expect: {
		timeout: 10000 // 10 second timeout for assertions
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
			use: {
				...{} // devices['Desktop Chrome'] - using default for now
			}
		}
	],
	// Only use webServer when running isolated E2E tests
	// For full-stack tests, we handle service orchestration in the script
	webServer: process.env.E2E_ISOLATED
		? {
				command: 'npm run build && npm run preview',
				port: 4173,
				timeout: 120 * 1000, // 2 minutes
				reuseExistingServer: !process.env.CI
			}
		: undefined
});
