// Message handling for Socket.IO connections with LangGraph integration

import type { Socket } from 'socket.io';
import type { SocketHandler, ChatMessage } from '../../types/socket.js';
import type { LangGraphManager } from '../../langgraph/LangGraphManager.js';
import type { StreamingManager } from '../../langgraph/StreamingManager.js';
import type { AuthHandler } from './AuthHandler.js';

export class MessageHandler implements SocketHandler {
	constructor(
		private langGraphManager: LangGraphManager,
		private streamingManager: StreamingManager,
		private authHandler: AuthHandler
	) {}

	handleConnection(socket: Socket): void {
		// Send message to assistant
		socket.on('send_message', async (data: {
			thread_id: string;
			content: string;
			assistant_id?: string;
			config?: Record<string, any>;
		}) => {
			if (!this.authHandler.isAuthenticated(socket)) {
				socket.emit('error', { message: 'Authentication required', code: 'AUTH_REQUIRED' });
				return;
			}

			try {
				await this.sendMessage(socket, data);
			} catch (error) {
				console.error('Error sending message:', error);
				socket.emit('error', {
					message: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
					code: 'MESSAGE_SEND_FAILED'
				});
			}
		});

		// Simple assistant invocation (for testing)
		socket.on('invoke_assistant', async (data: {
			assistant_id: string;
			message: string;
			config?: Record<string, any>;
		}) => {
			if (!this.authHandler.isAuthenticated(socket)) {
				socket.emit('error', { message: 'Authentication required', code: 'AUTH_REQUIRED' });
				return;
			}

			try {
				await this.invokeAssistant(socket, data);
			} catch (error) {
				console.error(`Error invoking assistant ${data.assistant_id}:`, error);
				socket.emit('assistant_error', {
					assistant_id: data.assistant_id,
					assistant_name: data.assistant_id,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		});
	}

	private async sendMessage(socket: Socket, data: {
		thread_id: string;
		content: string;
		assistant_id?: string;
		config?: Record<string, any>;
	}): Promise<void> {
		const { thread_id, content, assistant_id, config } = data;
		const userInfo = this.authHandler.getAuthenticatedUser(socket);
		
		if (!userInfo) {
			throw new Error('User not authenticated');
		}

		console.log(`Sending message to thread ${thread_id.substring(0, 8)}... (assistant: ${assistant_id || 'default'})`);

		// Create user message
		const userMessage: ChatMessage = {
			id: this.generateMessageId(),
			type: 'human',
			content,
			sender_id: userInfo.userId,
			sender_type: 'user',
			timestamp: new Date().toISOString(),
			thread_id,
			additional_kwargs: {}
		};

		// Emit user message
		socket.emit('message_received', userMessage);

		// If assistant_id is specified, invoke that assistant
		if (assistant_id) {
			await this.processAssistantResponse(socket, assistant_id, content, thread_id, config);
		} else {
			// TODO: Handle thread-based routing when multiple assistants are in a thread
			console.log('Thread-based assistant routing not yet implemented');
		}
	}

	private async invokeAssistant(socket: Socket, data: {
		assistant_id: string;
		message: string;
		config?: Record<string, any>;
	}): Promise<void> {
		const { assistant_id, message, config } = data;
		const userInfo = this.authHandler.getAuthenticatedUser(socket);
		
		if (!userInfo) {
			throw new Error('User not authenticated');
		}

		console.log(`Invoking assistant ${assistant_id} with message: ${message.substring(0, 50)}...`);

		// Check if assistant exists
		if (!this.langGraphManager.hasAssistant(assistant_id)) {
			throw new Error(`Assistant ${assistant_id} not found`);
		}

		// Generate message ID for this interaction
		const messageId = this.generateMessageId();
		const threadId = this.generateThreadId(); // Temporary thread for simple invocation

		// Start streaming
		this.streamingManager.startStreaming(messageId, threadId, assistant_id);

		// Emit start event
		const assistant = this.langGraphManager.getAssistants().find(a => a.id === assistant_id);
		socket.emit('assistant_response_start', {
			message_id: messageId,
			assistant_id,
			assistant_name: assistant?.name || assistant_id
		});

		try {
			// Invoke assistant
			const authToken = this.authHandler.getAuthToken(socket);
			const response = await this.langGraphManager.invokeAssistant(
				assistant_id,
				{ message, config },
				authToken
			);

			// Simulate streaming by breaking response into chunks
			await this.simulateStreaming(socket, messageId, response.response);

			// Create final AI message
			const aiMessage: ChatMessage = {
				id: messageId,
				type: 'ai',
				content: response.response,
				sender_id: assistant_id,
				sender_type: 'assistant',
				timestamp: new Date().toISOString(),
				thread_id: threadId,
				assistant_id,
				additional_kwargs: response.metadata || {}
			};

			// Complete streaming and emit final message
			this.streamingManager.completeStreaming(messageId);
			socket.emit('assistant_response_complete', aiMessage);

			console.log(`Assistant ${assistant_id} response completed (length: ${response.response.length})`);

		} catch (error) {
			console.error(`Assistant ${assistant_id} invocation failed:`, error);
			
			// Clean up streaming
			this.streamingManager.cleanupStreamingMessage(messageId);
			
			// Emit error
			socket.emit('assistant_response_error', {
				message_id: messageId,
				assistant_id,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			
			throw error;
		}
	}

	private async processAssistantResponse(
		socket: Socket,
		assistantId: string,
		message: string,
		threadId: string,
		config?: Record<string, any>
	): Promise<void> {
		// Check if assistant exists
		if (!this.langGraphManager.hasAssistant(assistantId)) {
			throw new Error(`Assistant ${assistantId} not found`);
		}

		// Generate message ID
		const messageId = this.generateMessageId();

		// Start streaming
		this.streamingManager.startStreaming(messageId, threadId, assistantId);

		// Emit start event
		const assistant = this.langGraphManager.getAssistants().find(a => a.id === assistantId);
		socket.emit('assistant_response_start', {
			message_id: messageId,
			assistant_id: assistantId,
			assistant_name: assistant?.name || assistantId
		});

		try {
			// Invoke assistant
			const authToken = this.authHandler.getAuthToken(socket);
			const response = await this.langGraphManager.invokeAssistant(
				assistantId,
				{ message, thread_id: threadId, config },
				authToken
			);

			// Simulate streaming response
			await this.simulateStreaming(socket, messageId, response.response);

			// Create final AI message
			const aiMessage: ChatMessage = {
				id: messageId,
				type: 'ai',
				content: response.response,
				sender_id: assistantId,
				sender_type: 'assistant',
				timestamp: new Date().toISOString(),
				thread_id: threadId,
				assistant_id: assistantId,
				additional_kwargs: response.metadata || {}
			};

			// Complete streaming and emit final message
			this.streamingManager.completeStreaming(messageId);
			socket.emit('assistant_response_complete', aiMessage);

			console.log(`Assistant ${assistantId} response completed for thread ${threadId.substring(0, 8)}...`);

		} catch (error) {
			console.error(`Assistant ${assistantId} failed for thread ${threadId}:`, error);
			
			// Clean up streaming
			this.streamingManager.cleanupStreamingMessage(messageId);
			
			// Emit error
			socket.emit('assistant_response_error', {
				message_id: messageId,
				assistant_id: assistantId,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			
			throw error;
		}
	}

	/**
	 * Simulate streaming by breaking response into chunks
	 */
	private async simulateStreaming(socket: Socket, messageId: string, fullResponse: string): Promise<void> {
		const words = fullResponse.split(' ');
		const chunkSize = 3; // Words per chunk
		let chunkIndex = 0;

		for (let i = 0; i < words.length; i += chunkSize) {
			const chunk = words.slice(i, i + chunkSize).join(' ');
			const isLastChunk = i + chunkSize >= words.length;
			
			// Add space if not the last chunk
			const chunkContent = isLastChunk ? chunk : chunk + ' ';
			
			// Add to streaming manager
			this.streamingManager.addContent(messageId, chunkContent);
			
			// Emit chunk
			socket.emit('message_chunk', {
				message_id: messageId,
				content: chunkContent,
				chunk_index: chunkIndex++,
				is_final: isLastChunk
			});

			// Small delay to simulate real streaming
			if (!isLastChunk) {
				await new Promise(resolve => setTimeout(resolve, 50));
			}
		}
	}

	/**
	 * Generate unique message ID
	 */
	private generateMessageId(): string {
		return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Generate unique thread ID
	 */
	private generateThreadId(): string {
		return `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Get message handling statistics
	 */
	getStats(): {
		activeStreamingMessages: number;
		totalMessagesProcessed: number;
		averageResponseTime: number;
	} {
		const streamingStats = this.streamingManager.getStats();
		
		// TODO: Track message processing statistics
		return {
			activeStreamingMessages: streamingStats.activeStreams,
			totalMessagesProcessed: 0, // TODO: Implement counter
			averageResponseTime: 0 // TODO: Implement timing tracking
		};
	}
}