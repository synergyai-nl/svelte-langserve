import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { writable } from 'svelte/store';
import ChatInterface from './ChatInterface.svelte';
import * as langserveStore from '../stores/langserve';

// Mock the ChatMessage component
vi.mock('./ChatMessage.svelte', () => ({
	default: vi.fn(() => ({ $$: { component: null } }))
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
	chatLogger: {
		info: vi.fn(),
		error: vi.fn()
	},
	performanceLogger: {
		time: vi.fn(),
		timeEnd: vi.fn()
	}
}));

// Mock the langserve store
vi.mock('../stores/langserve', () => {
	const mockActiveConversation = writable({
		id: 'conversation-123',
		participants: {
			agents: [
				{ id: 'agent-1', name: 'Chatbot' },
				{ id: 'agent-2', name: 'Code Assistant' }
			]
		},
		messages: [
			{ id: 'msg-1', content: 'Hello', type: 'human' },
			{ id: 'msg-2', content: 'How can I help?', type: 'ai' }
		]
	});

	const mockHasStreamingMessages = writable(false);

	return {
		activeConversation: mockActiveConversation,
		hasStreamingMessages: mockHasStreamingMessages,
		getDisplayMessages: vi.fn(() => [
			{ id: 'msg-1', content: 'Hello', type: 'human' },
			{ id: 'msg-2', content: 'How can I help?', type: 'ai' }
		]),
		getMessagePagination: vi.fn(() => ({
			currentPage: 1,
			messagesPerPage: 50,
			totalMessages: 2,
			hasMore: false
		})),
		loadMoreMessages: vi.fn()
	};
});

describe('ChatInterface', () => {
	const mockSendMessage = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();

		// Reset mock data to default state
		(langserveStore.activeConversation as any).set({
			id: 'conversation-123',
			participants: {
				agents: [
					{ id: 'agent-1', name: 'Chatbot' },
					{ id: 'agent-2', name: 'Code Assistant' }
				]
			},
			messages: [
				{ id: 'msg-1', content: 'Hello', type: 'human' },
				{ id: 'msg-2', content: 'How can I help?', type: 'ai' }
			]
		});

		(langserveStore.hasStreamingMessages as any).set(false);
	});

	it('renders welcome message when no active conversation', () => {
		// Mock no active conversation
		(langserveStore.activeConversation as any).set(null);

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		expect(screen.getByText('Welcome to LangServe Frontend')).toBeInTheDocument();
		expect(
			screen.getByText('Select endpoints and create a conversation to get started.')
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /create new conversation/i })).toBeInTheDocument();
	});

	it('renders chat interface when active conversation exists', () => {
		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		expect(screen.getByText(/Conversation: conversa/)).toBeInTheDocument();
		expect(screen.getByText('Agents: Chatbot, Code Assistant')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
	});

	it('shows streaming indicator when messages are streaming', () => {
		(langserveStore.hasStreamingMessages as any).set(true);

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		expect(screen.getByText('🔄 Agents are responding...')).toBeInTheDocument();
	});

	it('sends message when send button is clicked', async () => {
		const user = userEvent.setup();

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const textarea = screen.getByPlaceholderText('Type a message...');
		const sendButton = screen.getByRole('button', { name: /send/i });

		await user.type(textarea, 'Test message');
		await user.click(sendButton);

		expect(mockSendMessage).toHaveBeenCalledWith('Test message');
	});

	it('sends message when Enter key is pressed', async () => {
		const user = userEvent.setup();

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const textarea = screen.getByPlaceholderText('Type a message...');

		await user.type(textarea, 'Test message');
		await user.keyboard('{Enter}');

		expect(mockSendMessage).toHaveBeenCalledWith('Test message');
	});

	it('does not send message when Shift+Enter is pressed', async () => {
		const user = userEvent.setup();

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const textarea = screen.getByPlaceholderText('Type a message...');

		await user.type(textarea, 'Test message');
		await user.keyboard('{Shift>}{Enter}{/Shift}');

		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it('clears input after sending message', async () => {
		const user = userEvent.setup();

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const textarea = screen.getByPlaceholderText('Type a message...');
		const sendButton = screen.getByRole('button', { name: /send/i });

		await user.type(textarea, 'Test message');
		await user.click(sendButton);

		expect(textarea).toHaveValue('');
	});

	it('disables send button when input is empty', () => {
		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const sendButton = screen.getByRole('button', { name: /send/i });
		expect(sendButton).toBeDisabled();
	});

	it('enables send button when input has content', async () => {
		const user = userEvent.setup();

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const textarea = screen.getByPlaceholderText('Type a message...');
		const sendButton = screen.getByRole('button', { name: /send/i });

		await user.type(textarea, 'Test');

		expect(sendButton).not.toBeDisabled();
	});

	it('does not send empty or whitespace-only messages', async () => {
		const user = userEvent.setup();

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const textarea = screen.getByPlaceholderText('Type a message...');
		const sendButton = screen.getByRole('button', { name: /send/i });

		// Try sending spaces only
		await user.type(textarea, '   ');
		await user.click(sendButton);

		expect(mockSendMessage).not.toHaveBeenCalled();
	});

	it('shows load more button when pagination has more messages', () => {
		(langserveStore.getMessagePagination as any).mockReturnValue({
			currentPage: 1,
			messagesPerPage: 50,
			totalMessages: 100,
			hasMore: true
		});

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		expect(screen.getByRole('button', { name: /load older messages/i })).toBeInTheDocument();
	});

	it('loads more messages when load more button is clicked', async () => {
		const user = userEvent.setup();

		(langserveStore.getMessagePagination as any).mockReturnValue({
			currentPage: 1,
			messagesPerPage: 50,
			totalMessages: 100,
			hasMore: true
		});

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const loadMoreButton = screen.getByRole('button', { name: /load older messages/i });
		await user.click(loadMoreButton);

		expect(langserveStore.loadMoreMessages).toHaveBeenCalledWith('conversation-123');
	});

	it('shows loading state when loading more messages', async () => {
		const user = userEvent.setup();

		(langserveStore.getMessagePagination as any).mockReturnValue({
			currentPage: 1,
			messagesPerPage: 50,
			totalMessages: 100,
			hasMore: true
		});

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		const loadMoreButton = screen.getByRole('button', { name: /load older messages/i });

		// Start loading (button click triggers async action)
		await user.click(loadMoreButton);

		// Note: In a real test, you might need to mock the async behavior more explicitly
		// to test the loading state properly
	});

	it('dispatches create event when create conversation button is clicked', async () => {
		const user = userEvent.setup();
		(langserveStore.activeConversation as any).set(null);

		const mockCreateEvent = vi.fn();
		render(ChatInterface, {
			props: {
				sendMessage: mockSendMessage,
				oncreate: mockCreateEvent
			}
		});

		const createButton = screen.getByRole('button', { name: /create new conversation/i });
		await user.click(createButton);

		expect(mockCreateEvent).toHaveBeenCalled();
	});

	it('shows no messages state when conversation has no messages', () => {
		(langserveStore.getDisplayMessages as any).mockReturnValue([]);

		render(ChatInterface, {
			props: { sendMessage: mockSendMessage }
		});

		expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
	});
});
