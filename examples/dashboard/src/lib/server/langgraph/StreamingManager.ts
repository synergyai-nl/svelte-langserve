// Streaming response manager with memory management for LangGraph

export interface StreamingMessage {
	id: string;
	threadId: string;
	assistantId: string;
	content: string;
	startTime: number;
	lastUpdate: number;
}

export class StreamingManager {
	private streamingMessages: Map<string, StreamingMessage> = new Map();
	private streamingTimeouts: Map<string, NodeJS.Timeout> = new Map();
	private cleanupCallbacks: Map<string, () => void> = new Map();
	private cleanupInterval: NodeJS.Timeout | null = null;

	// Configuration
	private readonly STREAMING_TIMEOUT = 30000; // 30 seconds
	private readonly MAX_STREAMING_MESSAGES = 10; // Maximum concurrent streaming messages
	private readonly CLEANUP_INTERVAL = 60000; // 1 minute
	private readonly MAX_MESSAGE_AGE = 120000; // 2 minutes

	constructor() {
		this.startCleanupInterval();
	}

	/**
	 * Start a new streaming message
	 */
	startStreaming(messageId: string, threadId: string, assistantId: string): void {
		// Check for too many concurrent streaming messages
		if (this.streamingMessages.size >= this.MAX_STREAMING_MESSAGES) {
			console.warn(
				`Maximum concurrent streaming messages reached (${this.MAX_STREAMING_MESSAGES}), cleaning up oldest`
			);
			this.cleanupOldestMessage();
		}

		const now = Date.now();
		const streamingMessage: StreamingMessage = {
			id: messageId,
			threadId,
			assistantId,
			content: '',
			startTime: now,
			lastUpdate: now
		};

		this.streamingMessages.set(messageId, streamingMessage);

		// Set timeout for cleanup if streaming stops unexpectedly
		const timeout = setTimeout(() => {
			console.warn(`Streaming timeout reached for message ${messageId.substring(0, 8)}...`);
			this.cleanupStreamingMessage(messageId);
		}, this.STREAMING_TIMEOUT);

		this.streamingTimeouts.set(messageId, timeout);

		console.log(
			`Started streaming for message ${messageId.substring(0, 8)}... (assistant: ${assistantId})`
		);
	}

	/**
	 * Add content to a streaming message
	 */
	addContent(messageId: string, content: string): string | null {
		const streamingMessage = this.streamingMessages.get(messageId);
		if (!streamingMessage) {
			console.warn(
				`Attempted to add content to unknown streaming message: ${messageId.substring(0, 8)}...`
			);
			return null;
		}

		streamingMessage.content += content;
		streamingMessage.lastUpdate = Date.now();

		// Reset timeout
		const existingTimeout = this.streamingTimeouts.get(messageId);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		const timeout = setTimeout(() => {
			console.warn(`Streaming timeout reached for message ${messageId.substring(0, 8)}...`);
			this.cleanupStreamingMessage(messageId);
		}, this.STREAMING_TIMEOUT);

		this.streamingTimeouts.set(messageId, timeout);

		return streamingMessage.content;
	}

	/**
	 * Complete streaming for a message
	 */
	completeStreaming(messageId: string): string | null {
		const streamingMessage = this.streamingMessages.get(messageId);
		if (!streamingMessage) {
			console.warn(
				`Attempted to complete unknown streaming message: ${messageId.substring(0, 8)}...`
			);
			return null;
		}

		const finalContent = streamingMessage.content;
		this.cleanupStreamingMessage(messageId);

		console.log(
			`Completed streaming for message ${messageId.substring(0, 8)}... (length: ${finalContent.length})`
		);
		return finalContent;
	}

	/**
	 * Get current content of a streaming message
	 */
	getStreamingContent(messageId: string): string | null {
		const streamingMessage = this.streamingMessages.get(messageId);
		return streamingMessage?.content || null;
	}

	/**
	 * Check if a message is currently streaming
	 */
	isStreaming(messageId: string): boolean {
		return this.streamingMessages.has(messageId);
	}

	/**
	 * Get all streaming messages for a thread
	 */
	getStreamingMessagesForThread(threadId: string): StreamingMessage[] {
		return Array.from(this.streamingMessages.values()).filter((msg) => msg.threadId === threadId);
	}

	/**
	 * Add a cleanup callback for a streaming message
	 */
	addCleanupCallback(messageId: string, callback: () => void): void {
		this.cleanupCallbacks.set(messageId, callback);
	}

	/**
	 * Clean up a specific streaming message
	 */
	cleanupStreamingMessage(messageId: string): void {
		console.log(`Cleaning up streaming message ${messageId.substring(0, 8)}...`);

		// Clear timeout
		const timeout = this.streamingTimeouts.get(messageId);
		if (timeout) {
			clearTimeout(timeout);
			this.streamingTimeouts.delete(messageId);
		}

		// Run custom cleanup callback
		const cleanup = this.cleanupCallbacks.get(messageId);
		if (cleanup) {
			try {
				cleanup();
			} catch (error) {
				console.error(`Error in cleanup callback for message ${messageId}:`, error);
			}
			this.cleanupCallbacks.delete(messageId);
		}

		// Remove from streaming messages
		this.streamingMessages.delete(messageId);
	}

	/**
	 * Clean up the oldest streaming message
	 */
	private cleanupOldestMessage(): void {
		let oldestMessageId: string | null = null;
		let oldestTime = Date.now();

		for (const [messageId, message] of this.streamingMessages) {
			if (message.startTime < oldestTime) {
				oldestTime = message.startTime;
				oldestMessageId = messageId;
			}
		}

		if (oldestMessageId) {
			console.log(`Cleaning up oldest streaming message: ${oldestMessageId.substring(0, 8)}...`);
			this.cleanupStreamingMessage(oldestMessageId);
		}
	}

	/**
	 * Start periodic cleanup interval
	 */
	private startCleanupInterval(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		this.cleanupInterval = setInterval(() => {
			this.performPeriodicCleanup();
		}, this.CLEANUP_INTERVAL);
	}

	/**
	 * Perform periodic cleanup of stale streaming messages
	 */
	private performPeriodicCleanup(): void {
		const now = Date.now();
		const staleMessages: string[] = [];

		for (const [messageId, message] of this.streamingMessages) {
			const age = now - message.startTime;
			const timeSinceUpdate = now - message.lastUpdate;

			// Clean up very old messages or messages with no recent updates
			if (age > this.MAX_MESSAGE_AGE || timeSinceUpdate > this.STREAMING_TIMEOUT * 2) {
				staleMessages.push(messageId);
			}
		}

		if (staleMessages.length > 0) {
			console.log(`Cleaning up ${staleMessages.length} stale streaming messages`);
			staleMessages.forEach((messageId) => this.cleanupStreamingMessage(messageId));
		}
	}

	/**
	 * Get current statistics
	 */
	getStats(): {
		activeStreams: number;
		totalMemoryUsage: number;
		averageMessageLength: number;
	} {
		const messages = Array.from(this.streamingMessages.values());
		const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);

		return {
			activeStreams: messages.length,
			totalMemoryUsage: totalLength * 2, // Rough estimate (2 bytes per character for UTF-16)
			averageMessageLength: messages.length > 0 ? totalLength / messages.length : 0
		};
	}

	/**
	 * Cleanup all streaming messages and stop intervals
	 */
	destroy(): void {
		console.log('Destroying streaming manager...');

		// Clean up all streaming messages
		for (const messageId of this.streamingMessages.keys()) {
			this.cleanupStreamingMessage(messageId);
		}

		// Stop cleanup interval
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		console.log('Streaming manager destroyed');
	}
}
