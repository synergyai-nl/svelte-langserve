import { LangServeClient } from '../client.js';
import { createConnectionStore } from './connection.js';
import { createConversationStore } from './conversations.js';
import type { LangServeConfig } from '@svelte-langserve/types';

/**
 * Create a complete LangServe store with connection and conversation management
 */
export function createLangServeStore(config: LangServeConfig) {
  const client = new LangServeClient(config);
  const connection = createConnectionStore(client);
  const conversations = createConversationStore(client);

  return {
    client,
    connection,
    conversations,
  };
}