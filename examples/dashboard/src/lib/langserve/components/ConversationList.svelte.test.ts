import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { writable } from 'svelte/store';
import ConversationList from './ConversationList.svelte';
import * as langserveStore from '../stores/langserve';

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
	const mockSetActiveConversationId = vi.fn();

	return {
		conversations: mockConversations,
		activeConversationId: mockActiveConversationId,
		setActiveConversationId: mockSetActiveConversationId
	};
});

describe('ConversationList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Reset mock data to default state
		langserveStore.conversations.set([
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
		
		langserveStore.activeConversationId.set('conversation-123');
	});

	it('renders conversation list title', () => {
		render(ConversationList);
		
		expect(screen.getByText('Conversations')).toBeInTheDocument();
	});

	it('displays conversations with correct information', () => {
		render(ConversationList);
		
		// First conversation
		expect(screen.getAllByText('ID:')).toHaveLength(2);
		expect(screen.getAllByText('conversa...')).toHaveLength(2); // Both conversations have truncated IDs
		expect(screen.getByText('Chatbot, Code Assistant')).toBeInTheDocument();
		expect(screen.getAllByText('Messages:')).toHaveLength(2);
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
		
		render(ConversationList);
		
		const conversationButtons = screen.getAllByRole('button');
		await user.click(conversationButtons[1]); // Click second conversation
		
		expect(langserveStore.setActiveConversationId).toHaveBeenCalledWith('conversation-456');
	});

	it('calls setActiveConversationId when Enter key is pressed', async () => {
		const user = userEvent.setup();
		
		render(ConversationList);
		
		const conversationButtons = screen.getAllByRole('button');
		await user.type(conversationButtons[1], '{enter}');
		
		expect(langserveStore.setActiveConversationId).toHaveBeenCalledWith('conversation-456');
	});

	it('shows empty state when no conversations exist', () => {
		// Mock empty conversations
		langserveStore.conversations.set([]);
		
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
		render(ConversationList);
		
		// Change active conversation
		langserveStore.activeConversationId.set('conversation-456');
		
		const conversationButtons = screen.getAllByRole('button');
		expect(conversationButtons[1]).toHaveClass('bg-blue-100');
		expect(conversationButtons[0]).toHaveClass('bg-gray-100');
	});

	it('updates when conversations list changes', () => {
		render(ConversationList);
		
		// Add new conversation
		langserveStore.conversations.set([
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
		expect(screen.getAllByText('conversa...')).toHaveLength(2);
	});
});