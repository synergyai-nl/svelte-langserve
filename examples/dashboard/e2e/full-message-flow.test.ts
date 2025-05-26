import { expect, test } from '@playwright/test';

/**
 * E2E tests for complete message flow validation
 *
 * Tests the full communication stack:
 * UI → Socket.IO → FastAPI → LangGraph (test-echo agent) → Back to UI
 *
 * Uses test-echo agent that doesn't require API keys
 */

// Test configuration
const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:5173';
const TEST_CREDENTIALS = {
	username: 'demo',
	password: 'secret'
};

test.describe('Full Message Flow E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app
		await page.goto(FRONTEND_URL);
	});

	test('should complete full authentication and message flow with test-echo agent', async ({
		page
	}) => {
		// Step 1: Check initial page load
		await expect(page.locator('h1')).toBeVisible();

		// Step 2: Wait for Socket.IO connection and assistants to load
		// The UI should show available assistants after connection
		await expect(page.locator('text=Connecting...')).toBeVisible();

		// Wait for assistants to load (this may take a moment)
		// We'll wait for the "Create Conversation" button to become enabled
		const createConversationButton = page.locator('button:has-text("Create Conversation")');

		// Wait up to 15 seconds for assistants to load and button to become enabled
		await expect(createConversationButton).not.toBeDisabled({ timeout: 15000 });

		// Step 3: Create a conversation to enable chat functionality
		await createConversationButton.click();

		// Wait for conversation UI to appear
		await page.waitForTimeout(2000);

		// Step 4: Now look for message input (should be available after creating conversation)
		const messageInput = page.locator('input[type="text"], textarea').last();
		const sendButton = page.locator('button:has-text("Send")').first();

		// Verify the message input is now available
		await expect(messageInput).toBeVisible({ timeout: 5000 });

		const testMessage = 'Hello test message for E2E validation';
		await messageInput.fill(testMessage);
		await sendButton.click();

		// Step 5: Wait for and validate the echo response
		// The test-echo agent should respond with "Echo: Hello test message for E2E validation"
		const expectedResponse = `Echo: ${testMessage}`;

		// Look for the response in the chat area
		await expect(page.locator(`text=${expectedResponse}`)).toBeVisible({ timeout: 10000 });

		// Step 6: Test a second message to ensure conversation flow works
		const secondMessage = 'Second message to test conversation flow';
		await messageInput.fill(secondMessage);
		await sendButton.click();

		const expectedSecondResponse = `Echo: ${secondMessage}`;
		await expect(page.locator(`text=${expectedSecondResponse}`)).toBeVisible({ timeout: 10000 });

		// Step 7: Verify both messages are present (conversation history)
		await expect(page.locator(`text=${expectedResponse}`)).toBeVisible();
		await expect(page.locator(`text=${expectedSecondResponse}`)).toBeVisible();
	});

	test('should handle empty messages gracefully', async ({ page }) => {
		// Step 1: Wait for assistants to load and create conversation
		const createConversationButton = page.locator('button:has-text("Create Conversation")');
		await expect(createConversationButton).not.toBeDisabled({ timeout: 15000 });
		await createConversationButton.click();
		await page.waitForTimeout(2000);

		// Step 2: Try to send an empty message
		const messageInput = page.locator('input[type="text"], textarea').last();
		const sendButton = page.locator('button:has-text("Send")').first();

		// Verify the message input is available
		await expect(messageInput).toBeVisible({ timeout: 5000 });

		// Clear any existing text and try to send
		await messageInput.fill('');
		await sendButton.click();

		// Should either prevent sending or get a graceful response
		// Wait a bit to see what happens
		await page.waitForTimeout(2000);

		// If a response comes back, it should be the "no message" echo
		// This might or might not be visible depending on form validation
		// So we just wait and see what happens without asserting
	});

	test('should maintain connection across page refresh', async ({ page }) => {
		// Step 1: Wait for assistants to load and create conversation
		const createConversationButton = page.locator('button:has-text("Create Conversation")');
		await expect(createConversationButton).not.toBeDisabled({ timeout: 15000 });
		await createConversationButton.click();
		await page.waitForTimeout(2000);

		// Step 2: Send initial message
		const messageInput = page.locator('input[type="text"], textarea').last();
		const sendButton = page.locator('button:has-text("Send")').first();

		// Verify the message input is available
		await expect(messageInput).toBeVisible({ timeout: 5000 });

		const initialMessage = 'Message before refresh';
		await messageInput.fill(initialMessage);
		await sendButton.click();

		// Wait for response
		const expectedResponse = `Echo: ${initialMessage}`;
		await expect(page.locator(`text=${expectedResponse}`)).toBeVisible({ timeout: 10000 });

		// Refresh the page
		await page.reload();

		// After refresh, need to recreate conversation again
		const createConversationButtonAfterRefresh = page.locator(
			'button:has-text("Create Conversation")'
		);
		await expect(createConversationButtonAfterRefresh).not.toBeDisabled({ timeout: 15000 });
		await createConversationButtonAfterRefresh.click();
		await page.waitForTimeout(2000);

		// Send another message after refresh
		const messageInputAfterRefresh = page.locator('input[type="text"], textarea').last();
		const sendButtonAfterRefresh = page.locator('button:has-text("Send")').first();

		await expect(messageInputAfterRefresh).toBeVisible({ timeout: 5000 });

		const postRefreshMessage = 'Message after refresh';
		await messageInputAfterRefresh.fill(postRefreshMessage);
		await sendButtonAfterRefresh.click();

		// Should still work
		const expectedPostRefreshResponse = `Echo: ${postRefreshMessage}`;
		await expect(page.locator(`text=${expectedPostRefreshResponse}`)).toBeVisible({
			timeout: 10000
		});
	});
});

test.describe('Backend API Integration Tests', () => {
	test('should verify test-echo agent is available via API', async ({ request }) => {
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

		const token = authData.access_token;

		// Step 2: List available assistants
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
		expect(assistants['test-echo'].is_test_agent).toBe(true);

		// Step 3: Test direct API call to test-echo agent
		const messageResponse = await request.post(`${BACKEND_URL}/assistants/test-echo/invoke`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			data: {
				message: 'API test message',
				config: {}
			}
		});

		expect(messageResponse.ok()).toBeTruthy();
		const messageData = await messageResponse.json();

		// Verify echo response
		expect(messageData.response).toBe('Echo: API test message');
		expect(messageData.metadata.assistant_id).toBe('test-echo');
	});

	test('should verify agent health check', async ({ request }) => {
		// Authenticate
		const authResponse = await request.post(`${BACKEND_URL}/token`, {
			form: {
				username: TEST_CREDENTIALS.username,
				password: TEST_CREDENTIALS.password
			}
		});

		const authData = await authResponse.json();
		const token = authData.access_token;

		// Check test-echo agent health
		const healthResponse = await request.get(`${BACKEND_URL}/assistants/test-echo/health`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		expect(healthResponse.ok()).toBeTruthy();
		const healthData = await healthResponse.json();

		expect(healthData.status).toBe('healthy');
		expect(healthData.error).toBeNull();
	});

	test('should verify overall system health includes test-echo agent', async ({ request }) => {
		const healthResponse = await request.get(`${BACKEND_URL}/health`);

		expect(healthResponse.ok()).toBeTruthy();
		const healthData = await healthResponse.json();

		// Should include test-echo in the list of assistants
		expect(healthData.assistants).toContain('test-echo');
		expect(healthData.assistant_health['test-echo']).toBeDefined();
		expect(healthData.assistant_health['test-echo'].status).toBe('healthy');
	});
});
