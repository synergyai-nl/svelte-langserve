// Client functionality - for now, most client logic is embedded in stores
// Future refactoring could extract Socket.IO management here

export class LangGraphClient {
  // Placeholder for future client extraction from stores
  // This would handle Socket.IO connection management independently of Svelte stores
}

// Re-export any client utilities
export * from './socket-manager.js';
export * from './langgraph-adapter.js';