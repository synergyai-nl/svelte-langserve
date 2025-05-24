import type { LangServeClient } from '../client.js';
import type { Conversation, StreamingResponse } from '@svelte-langserve/types';

/**
 * Create a reactive store for managing conversations and messages
 */
export function createConversationStore(client: LangServeClient) {
  // Use $state if available (in Svelte runtime), otherwise plain variables for testing
  const conversations = typeof $state !== 'undefined' ? $state<Map<string, Conversation>>(new Map()) : new Map<string, Conversation>();
  let activeConversationId = typeof $state !== 'undefined' ? $state<string | null>(null) : null;
  const streamingMessages = typeof $state !== 'undefined' ? $state<Map<string, string>>(new Map()) : new Map<string, string>();

  const socket = client.getSocket();

  if (socket) {
    socket.on('conversation:created', (conversation) => {
      conversations.set(conversation.id, conversation);
    });

    socket.on('conversation:updated', (conversation) => {
      conversations.set(conversation.id, conversation);
    });

    socket.on('message:received', (message) => {
      const conversation = conversations.get(message.conversationId);
      if (conversation) {
        conversation.messages = [...conversation.messages, message];
        conversation.updatedAt = new Date();
        conversations.set(conversation.id, conversation);
      }
    });

    socket.on('message:streaming', (data: StreamingResponse) => {
      if (data.type === 'token') {
        const current = streamingMessages.get(data.messageId) || '';
        streamingMessages.set(data.messageId, current + data.content);
      } else if (data.type === 'complete') {
        streamingMessages.delete(data.messageId);
      }
    });

    socket.on('error', (error) => {
      console.error('LangServe error:', error);
    });
  }

  function createConversation(endpointId: string, title?: string) {
    if (socket) {
      socket.emit('conversation:create', { endpointId, title });
    }
  }

  function sendMessage(content: string, conversationId: string, endpointId: string) {
    if (socket) {
      socket.emit('message:send', { content, conversationId, endpointId });
    }
  }

  function joinConversation(conversationId: string) {
    if (socket) {
      socket.emit('conversation:join', conversationId);
      activeConversationId = conversationId;
    }
  }

  function leaveConversation(conversationId: string) {
    if (socket) {
      socket.emit('conversation:leave', conversationId);
      if (activeConversationId === conversationId) {
        activeConversationId = null;
      }
    }
  }

  function getConversation(id: string): Conversation | undefined {
    return conversations.get(id);
  }

  function getAllConversations(): Conversation[] {
    return Array.from(conversations.values());
  }

  function getStreamingContent(messageId: string): string | undefined {
    return streamingMessages.get(messageId);
  }

  return {
    get conversations() { return Array.from(conversations.values()); },
    get activeConversationId() { return activeConversationId; },
    get activeConversation() { 
      return activeConversationId ? conversations.get(activeConversationId) : undefined; 
    },
    createConversation,
    sendMessage,
    joinConversation,
    leaveConversation,
    getConversation,
    getAllConversations,
    getStreamingContent,
  };
}