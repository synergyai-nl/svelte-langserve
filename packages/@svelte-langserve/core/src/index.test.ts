import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LangServeClient } from './lib/client.js';
import { createLangServeStore, createConnectionStore, createConversationStore } from './lib/stores/index.js';
import type { LangServeConfig } from '@svelte-langserve/types';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
  })),
}));

describe('@svelte-langserve/core', () => {
  const mockConfig: LangServeConfig = {
    socketUrl: 'http://localhost:3000',
    endpoints: [
      {
        id: 'test-endpoint',
        name: 'Test Endpoint',
        url: 'http://localhost:8000/test',
        type: 'chatbot',
      },
    ],
  };

  describe('LangServeClient', () => {
    let client: LangServeClient;

    beforeEach(() => {
      client = new LangServeClient(mockConfig);
    });

    it('should create a client with config', () => {
      expect(client).toBeDefined();
      expect(client.getConfig()).toEqual(mockConfig);
    });

    it('should initially not be connected', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should return null socket when not connected', () => {
      expect(client.getSocket()).toBeNull();
    });

    it('should update configuration', () => {
      const newConfig = { socketUrl: 'http://localhost:4000' };
      client.updateConfig(newConfig);
      expect(client.getConfig().socketUrl).toBe('http://localhost:4000');
    });

    it('should connect and return socket', () => {
      const socket = client.connect();
      expect(socket).toBeDefined();
      expect(client.getSocket()).toBe(socket);
    });

    it('should disconnect properly', () => {
      client.connect();
      client.disconnect();
      expect(client.getSocket()).toBeNull();
    });
  });

  describe('createLangServeStore', () => {
    it('should create store with client, connection, and conversations', () => {
      const store = createLangServeStore(mockConfig);
      
      expect(store.client).toBeInstanceOf(LangServeClient);
      expect(store.connection).toBeDefined();
      expect(store.conversations).toBeDefined();
    });
  });

  describe('createConnectionStore', () => {
    let client: LangServeClient;

    beforeEach(() => {
      client = new LangServeClient(mockConfig);
    });

    it('should create connection store with initial state', () => {
      const connection = createConnectionStore(client);
      
      expect(connection.connected).toBe(false);
      expect(connection.connecting).toBe(false);
      expect(connection.error).toBeNull();
    });

    it('should have connect and disconnect methods', () => {
      const connection = createConnectionStore(client);
      
      expect(typeof connection.connect).toBe('function');
      expect(typeof connection.disconnect).toBe('function');
    });
  });

  describe('createConversationStore', () => {
    let client: LangServeClient;

    beforeEach(() => {
      client = new LangServeClient(mockConfig);
    });

    it('should create conversation store with initial state', () => {
      const conversations = createConversationStore(client);
      
      expect(conversations.conversations).toEqual([]);
      expect(conversations.activeConversationId).toBeNull();
      expect(conversations.activeConversation).toBeUndefined();
    });

    it('should have conversation management methods', () => {
      const conversations = createConversationStore(client);
      
      expect(typeof conversations.createConversation).toBe('function');
      expect(typeof conversations.sendMessage).toBe('function');
      expect(typeof conversations.joinConversation).toBe('function');
      expect(typeof conversations.leaveConversation).toBe('function');
      expect(typeof conversations.getConversation).toBe('function');
      expect(typeof conversations.getAllConversations).toBe('function');
      expect(typeof conversations.getStreamingContent).toBe('function');
    });

    it('should return empty array for getAllConversations initially', () => {
      const conversations = createConversationStore(client);
      expect(conversations.getAllConversations()).toEqual([]);
    });

    it('should return undefined for non-existent conversation', () => {
      const conversations = createConversationStore(client);
      expect(conversations.getConversation('non-existent')).toBeUndefined();
    });

    it('should return undefined for non-existent streaming content', () => {
      const conversations = createConversationStore(client);
      expect(conversations.getStreamingContent('non-existent')).toBeUndefined();
    });
  });
});