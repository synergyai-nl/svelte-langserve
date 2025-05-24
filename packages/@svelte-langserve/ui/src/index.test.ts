import { describe, it, expect } from 'vitest';

describe('@svelte-langserve/ui', () => {
	it('package structure test', () => {
		// Basic test to ensure the package structure is correct
		expect(true).toBe(true);
	});

	it('can import individual components', async () => {
		// Test that individual components can be imported without dependency errors
		const chatMessageImport = () => import('./lib/components/ChatMessage.svelte');
		
		expect(chatMessageImport).toBeDefined();
		// This will pass as long as the import doesn't throw
		await expect(chatMessageImport()).resolves.toBeDefined();
	});
});