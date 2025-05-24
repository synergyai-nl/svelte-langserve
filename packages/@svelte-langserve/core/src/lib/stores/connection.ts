import type { LangServeClient } from '../client.js';

/**
 * Create a reactive store for Socket.IO connection state
 */
export function createConnectionStore(client: LangServeClient) {
  // Use $state if available (in Svelte runtime), otherwise plain variables for testing
  let connected = typeof $state !== 'undefined' ? $state(false) : false;
  let connecting = typeof $state !== 'undefined' ? $state(false) : false;
  let error = typeof $state !== 'undefined' ? $state<string | null>(null) : null;

  const socket = client.getSocket();

  if (socket) {
    socket.on('connect', () => {
      connected = true;
      connecting = false;
      error = null;
    });

    socket.on('disconnect', () => {
      connected = false;
      connecting = false;
    });

    socket.on('connect_error', (err) => {
      connected = false;
      connecting = false;
      error = err.message;
    });
  }

  function connect() {
    if (connected || connecting) return;
    
    connecting = true;
    error = null;
    client.connect();
  }

  function disconnect() {
    client.disconnect();
    connected = false;
    connecting = false;
  }

  return {
    get connected() { return connected; },
    get connecting() { return connecting; },
    get error() { return error; },
    connect,
    disconnect,
  };
}