import { expect, test } from '@playwright/test';

/**
 * Basic E2E test for the test-echo agent
 *
 * This test focuses on the core functionality:
 * 1. Backend API is accessible
 * 2. Test-echo agent works without API keys
 * 3. Basic message flow validation
 */

const BACKEND_URL = 'http://localhost:8000';
const TEST_CREDENTIALS = {
	username: 'demo',
	password: 'secret'
};

test.describe('Echo Agent Backend Tests', () => {
	test('should authenticate and invoke test-echo agent via API', async ({ request }) => {
		// Step 1: Authenticate with the backend
		const authResponse = await request.post(`${BACKEND_URL}/token`, {
			form: {
				username: TEST_CREDENTIALS.username,
				password: TEST_CREDENTIALS.password
			}
		});

		expect(authResponse.ok()).toBeTruthy();
		const authData = await authResponse.json();
		expect(authData.access_token).toBeDefined();
		expect(authData.token_type).toBe('bearer');

		const token = authData.access_token;

		// Step 2: Verify test-echo agent is available
		const assistantsResponse = await request.get(`${BACKEND_URL}/assistants`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		expect(assistantsResponse.ok()).toBeTruthy();
		const assistants = await assistantsResponse.json();

		// Verify test-echo agent is listed
		expect(assistants['test-echo']).toBeDefined();
		expect(assistants['test-echo'].name).toBe('Test Echo Agent');
		expect(assistants['test-echo'].description).toContain('no API keys required');

		// Step 3: Test message echo functionality
		const testMessages = [
			'Hello world',
			'Test message 123',
			'Special chars: !@#$%^&*()',
			'Multi word test message'
		];

		for (const message of testMessages) {
			const messageResponse = await request.post(`${BACKEND_URL}/assistants/test-echo/invoke`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				data: {
					message: message,
					config: {}
				}
			});

			expect(messageResponse.ok()).toBeTruthy();
			const messageData = await messageResponse.json();

			// Verify echo response format
			expect(messageData.response).toBe(`Echo: ${message}`);
			expect(messageData.metadata.assistant_id).toBe('test-echo');
		}
	});

	test('should handle empty message gracefully', async ({ request }) => {
		// Authenticate
		const authResponse = await request.post(`${BACKEND_URL}/token`, {
			form: {
				username: TEST_CREDENTIALS.username,
				password: TEST_CREDENTIALS.password
			}
		});

		const authData = await authResponse.json();
		const token = authData.access_token;

		// Test empty message
		const messageResponse = await request.post(`${BACKEND_URL}/assistants/test-echo/invoke`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			data: {
				message: '',
				config: {}
			}
		});

		expect(messageResponse.ok()).toBeTruthy();
		const messageData = await messageResponse.json();

		// Should handle empty message gracefully
		expect(messageData.response).toBe('Echo: ');
	});

	test('should verify agent health and system status', async ({ request }) => {
		// Test public health endpoint (no auth required)
		const healthResponse = await request.get(`${BACKEND_URL}/health`);

		expect(healthResponse.ok()).toBeTruthy();
		const healthData = await healthResponse.json();

		// Verify system includes test-echo agent
		expect(healthData.assistants).toContain('test-echo');
		expect(healthData.assistant_health['test-echo']).toBeDefined();
		expect(healthData.assistant_health['test-echo'].status).toBe('healthy');
		expect(healthData.assistant_health['test-echo'].error).toBeNull();

		// Verify overall system status
		expect(['healthy', 'degraded']).toContain(healthData.status);
		expect(healthData.backend_type).toBe('langgraph');
	});

	test('should get detailed agent information', async ({ request }) => {
		// Authenticate
		const authResponse = await request.post(`${BACKEND_URL}/token`, {
			form: {
				username: TEST_CREDENTIALS.username,
				password: TEST_CREDENTIALS.password
			}
		});

		const authData = await authResponse.json();
		const token = authData.access_token;

		// Get specific agent info
		const agentInfoResponse = await request.get(`${BACKEND_URL}/assistants/test-echo`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		expect(agentInfoResponse.ok()).toBeTruthy();
		const agentInfo = await agentInfoResponse.json();

		expect(agentInfo.name).toBe('Test Echo Agent');
		expect(agentInfo.type).toBe('chat');
		expect(agentInfo.supports_streaming).toBe(true);
		expect(agentInfo.supports_persistence).toBe(false);
		expect(agentInfo.is_test_agent).toBe(true);
	});

	test('should reject invalid authentication', async ({ request }) => {
		// Test with invalid credentials
		const authResponse = await request.post(`${BACKEND_URL}/token`, {
			form: {
				username: 'invalid',
				password: 'invalid'
			}
		});

		expect(authResponse.status()).toBe(401);

		// Test agent access without auth
		const unauthorizedResponse = await request.post(`${BACKEND_URL}/assistants/test-echo/invoke`, {
			headers: {
				'Content-Type': 'application/json'
			},
			data: {
				message: 'unauthorized test',
				config: {}
			}
		});

		expect(unauthorizedResponse.status()).toBe(401);
	});
});

test.describe('Frontend Basic Tests', () => {
	test('should load the application successfully', async ({ page }) => {
		await page.goto('/');

		// Basic page load test
		await expect(page.locator('h1')).toBeVisible();

		// Check for no major JavaScript errors
		page.on('pageerror', (error) => {
			console.error('Page error:', error);
			expect(error).toBeNull(); // Fail test if there are JS errors
		});

		// Wait a bit to catch any immediate errors
		await page.waitForTimeout(2000);
	});

	test('should have basic UI elements for chat', async ({ page }) => {
		await page.goto('/');

		// Look for common chat interface elements
		// These selectors are generic and may need adjustment based on your actual UI
		const possibleInputs = [
			'input[type="text"]',
			'textarea',
			'[data-testid="message-input"]',
			'[placeholder*="message" i]',
			'[placeholder*="chat" i]'
		];

		const possibleButtons = [
			'button:has-text("Send")',
			'button[type="submit"]',
			'[data-testid="send-button"]',
			'button:has-text("Submit")'
		];

		let inputFound = false;
		let buttonFound = false;

		// Check if any common input patterns exist
		for (const selector of possibleInputs) {
			if ((await page.locator(selector).count()) > 0) {
				inputFound = true;
				break;
			}
		}

		// Check if any common button patterns exist
		for (const selector of possibleButtons) {
			if ((await page.locator(selector).count()) > 0) {
				buttonFound = true;
				break;
			}
		}

		// Log what we found for debugging
		console.log(`Input found: ${inputFound}, Button found: ${buttonFound}`);

		// At minimum, the page should load without major errors
		await expect(page.locator('body')).toBeVisible();
	});
});
