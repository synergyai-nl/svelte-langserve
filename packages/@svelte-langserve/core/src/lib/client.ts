import { io, type Socket } from 'socket.io-client';
import type { LangServeConfig, SocketEvents } from '@svelte-langserve/types';

/**
 * LangServe client for managing Socket.IO connections
 */
export class LangServeClient {
  private socket: Socket<SocketEvents, SocketEvents> | null = null;
  private config: LangServeConfig;

  constructor(config: LangServeConfig) {
    this.config = config;
  }

  /**
   * Connect to the Socket.IO server
   */
  connect(): Socket<SocketEvents, SocketEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.config.socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
    });

    return this.socket;
  }

  /**
   * Disconnect from the Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket<SocketEvents, SocketEvents> | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LangServeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LangServeConfig {
    return this.config;
  }
}