import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { writable } from 'svelte/store';
import ConversationList from './ConversationList.svelte';

// Mock the langserve store
vi.mock('../stores/langserve', () => {
	const mockConversations = writable([
		{
			id: 'conversation-123',
			participants: {
				agents: [
					{ id: 'agent-1', name: 'Chatbot' },
					{ id: 'agent-2', name: 'Code Assistant' }
				]
			},
			messages: [
				{ id: 'msg-1', content: 'Hello' },
				{ id: 'msg-2', content: 'How can I help?' }
			]
		},
		{
			id: 'conversation-456',
			participants: {
				agents: [
					{ id: 'agent-3', name: 'Research Assistant' }
				]
			},
			messages: [
				{ id: 'msg-3', content: 'Research query' }
			]
		}
	]);

	const mockActiveConversationId = writable('conversation-123');

	return {
		conversations: mockConversations,
		activeConversationId: mockActiveConversationId,
		setActiveConversationId: vi.fn()
	};
});

describe('ConversationList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders conversation list title', () => {
		render(ConversationList);
		
		expect(screen.getByText('Conversations')).toBeInTheDocument();
	});

	it('displays conversations with correct information', () => {
		render(ConversationList);
		
		// First conversation
		expect(screen.getByText('ID:')).toBeInTheDocument();
		expect(screen.getByText('conversa...')).toBeInTheDocument(); // Truncated ID
		expect(screen.getByText('Chatbot, Code Assistant')).toBeInTheDocument();
		expect(screen.getByText('Messages:')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
		
		// Second conversation
		expect(screen.getByText('Research Assistant')).toBeInTheDocument();
		expect(screen.getByText('1')).toBeInTheDocument();
	});

	it('highlights active conversation', () => {
		render(ConversationList);
		
		const conversationButtons = screen.getAllByRole('button');
		const activeConversation = conversationButtons[0]; // First conversation is active
		
		expect(activeConversation).toHaveClass('bg-blue-100');
		expect(conversationButtons[1]).toHaveClass('bg-gray-100');
	});

	it('calls setActiveConversationId when conversation is clicked', async () => {
		const user = userEvent.setup();
		const { setActiveConversationId } = vi.importedMocks('../stores/langserve');
		
		render(ConversationList);
		
		const conversationButtons = screen.getAllByRole('button');
		await user.click(conversationButtons[1]); // Click second conversation
		
		expect(setActiveConversationId).toHaveBeenCalledWith('conversation-456');
	});

	it('calls setActiveConversationId when Enter key is pressed', async () => {
		const user = userEvent.setup();
		const { setActiveConversationId } = vi.importedMocks('../stores/langserve');
		
		render(ConversationList);
		
		const conversationButtons = screen.getAllByRole('button');
		await user.type(conversationButtons[1], '{enter}');
		
		expect(setActiveConversationId).toHaveBeenCalledWith('conversation-456');
	});

	it('shows empty state when no conversations exist', () => {
		// Mock empty conversations
		const { conversations } = vi.importedMocks('../stores/langserve');
		conversations.set([]);
		
		render(ConversationList);
		
		expect(screen.getByText('No conversations yet')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('has proper accessibility attributes', () => {
		render(ConversationList);
		
		const conversationButtons = screen.getAllByRole('button');
		
		conversationButtons.forEach(button => {
			expect(button).toHaveAttribute('tabindex', '0');
			expect(button).toHaveAttribute('role', 'button');
		});
	});

	it('shows correct agent names when single agent', () => {
		render(ConversationList);
		
		expect(screen.getByText('Research Assistant')).toBeInTheDocument();
	});

	it('shows correct agent names when multiple agents', () => {
		render(ConversationList);
		
		expect(screen.getByText('Chatbot, Code Assistant')).toBeInTheDocument();
	});

	it('updates when activeConversationId changes', () => {
		const { activeConversationId } = vi.importedMocks('../stores/langserve');
		
		render(ConversationList);
		
		// Change active conversation
		activeConversationId.set('conversation-456');
		
		const conversationButtons = screen.getAllByRole('button');
		expect(conversationButtons[1]).toHaveClass('bg-blue-100');
		expect(conversationButtons[0]).toHaveClass('bg-gray-100');
	});

	it('updates when conversations list changes', () => {
		const { conversations } = vi.importedMocks('../stores/langserve');
		
		render(ConversationList);
		
		// Add new conversation
		conversations.set([
			{
				id: 'conversation-789',
				participants: {
					agents: [{ id: 'agent-4', name: 'New Agent' }]
				},
				messages: []
			}
		]);
		
		expect(screen.getByText('New Agent')).toBeInTheDocument();
		expect(screen.getByText('0')).toBeInTheDocument(); // No messages
	});

	it('truncates conversation ID correctly', () => {
		render(ConversationList);
		
		// Should show first 8 characters + '...'
		expect(screen.getByText('conversa...')).toBeInTheDocument();
	});
});