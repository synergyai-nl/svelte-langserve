#!/usr/bin/env node

/**
 * Simple service testing script to validate backend functionality
 * without running full E2E tests. This helps debug service setup issues.
 */

import { spawn } from 'child_process';
// Using Node.js built-in fetch (available in Node.js 18+)

const BACKEND_PORT = 8000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

console.log('🧪 Testing Backend Service Startup');
console.log('===================================\n');

// Test backend in isolation
async function testBackend() {
	console.log('📦 Starting backend service...');

	// Set test mode environment
	const env = {
		...process.env,
		TEST_MODE: 'true',
		OPENAI_API_KEY: 'test-key-for-mocking',
		ANTHROPIC_API_KEY: 'test-key-for-mocking'
	};

	// Start backend
	const backend = spawn(
		'uv',
		['run', 'uvicorn', 'src.svelte_langgraph.app:app', '--host', '0.0.0.0', '--port', '8000'],
		{
			cwd: '../langgraph-backend',
			env: env,
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);

	// Capture logs
	let backendLogs = '';
	backend.stdout.on('data', (data) => {
		backendLogs += data.toString();
		if (data.toString().includes('Uvicorn running')) {
			console.log('✅ Backend server started');
		}
	});

	backend.stderr.on('data', (data) => {
		backendLogs += data.toString();
	});

	// Wait for backend to start
	console.log('⏳ Waiting for backend to be ready...');

	let attempts = 0;
	const maxAttempts = 30;

	while (attempts < maxAttempts) {
		try {
			const response = await fetch(`${BACKEND_URL}/health`);
			if (response.ok) {
				console.log('✅ Backend health check passed');
				break;
			}
		} catch {
			// Still starting up
		}

		attempts++;
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	if (attempts >= maxAttempts) {
		console.log('❌ Backend failed to start within 30 seconds');
		console.log('\nBackend logs:');
		console.log(backendLogs);
		backend.kill();
		process.exit(1);
	}

	// Test authentication
	console.log('🔐 Testing authentication...');
	try {
		const authResponse = await fetch(`${BACKEND_URL}/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: 'username=demo&password=secret'
		});

		if (authResponse.ok) {
			const authData = await authResponse.json();
			console.log('✅ Authentication successful');

			// Test echo agent
			console.log('🧪 Testing test-echo agent...');
			const testResponse = await fetch(`${BACKEND_URL}/assistants/test-echo/invoke`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authData.access_token}`
				},
				body: JSON.stringify({
					input: { messages: [{ type: 'human', content: 'Hello test' }] },
					config: {}
				})
			});

			if (testResponse.ok) {
				const testData = await testResponse.json();
				console.log('✅ test-echo agent working correctly');
				console.log(`📄 Response: ${testData.output.content.substring(0, 100)}...`);
			} else {
				console.log('❌ test-echo agent test failed');
				console.log(`Status: ${testResponse.status}`);
				console.log(`Response: ${await testResponse.text()}`);
			}
		} else {
			console.log('❌ Authentication failed');
			console.log(`Status: ${authResponse.status}`);
			console.log(`Response: ${await authResponse.text()}`);
		}
	} catch (error) {
		console.log('❌ Backend API test failed:', error.message);
	}

	// Cleanup
	console.log('\n🧹 Cleaning up...');
	backend.kill();

	// Wait a moment for cleanup
	await new Promise((resolve) => setTimeout(resolve, 1000));

	console.log('✅ Service test complete');
}

// Handle errors and cleanup
process.on('SIGINT', () => {
	console.log('\n🛑 Interrupted, cleaning up...');
	process.exit(0);
});

process.on('uncaughtException', (error) => {
	console.error('❌ Uncaught exception:', error);
	process.exit(1);
});

// Run tests
testBackend().catch((error) => {
	console.error('❌ Service test failed:', error);
	process.exit(1);
});
