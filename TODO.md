# Architecture Refactoring TODO

This document outlines a comprehensive refactoring plan to improve the project's simplicity, elegance, and reduce code duplication. The recommendations are based on a thorough analysis of the current codebase architecture.

## Background & Context

### Current State Analysis

The project is a SvelteKit-based dashboard for interacting with LangServe endpoints via Socket.IO. While it has a solid foundation with modern technologies, several architectural issues impact maintainability:

1. **Massive complexity concentration**: `hooks.server.ts` (657 lines) handles Socket.IO management, LangServe clients, conversation state, and streaming logic
2. **Code duplication**: Two separate LangServe store implementations with significant overlap
3. **Scattered configuration**: Environment variables and constants spread throughout the codebase
4. **Complex state management**: Manual Map cleanup, timeout handling, and imperative updates
5. **Unclear package boundaries**: Overlap between examples and packages

### Architecture Overview

```
Current Structure:
├── examples/dashboard/          # SvelteKit frontend with Socket.IO
├── examples/langserve-backend/  # FastAPI + LangServe backend
└── packages/@svelte-langserve/  # Reusable packages (underutilized)

Key Files:
- hooks.server.ts (657 lines) - Socket.IO + LangServe integration
- examples/.../stores/langserve.ts (657 lines) - Complex state management  
- packages/.../stores/langserve.ts (19 lines) - Minimal implementation
```

---

## Phase 1: Critical Foundation (Simplicity & Duplication)

### 1.1 Consolidate Packages AND Duplicate Store Implementations  
**Priority: 🔥🔥🔥 Critical** (UPDATED)
**Impact: Eliminates ~650 lines of duplicated code + package overhead**

**Current Problem:**
- **4 separate packages** with minimal functionality (46 files, 1774 lines total)
- **Duplicate store implementations:**
  - `examples/dashboard/src/lib/langserve/stores/langserve.ts` (657 lines)
  - `packages/@svelte-langserve/core/src/lib/stores/langserve.ts` (19 lines)

**Combined Solution:**
1. **Create single package** `packages/svelte-langserve/`
2. **Merge all 4 packages** into unified structure:
   ```
   packages/svelte-langserve/
   ├── src/lib/
   │   ├── stores/          # Full-featured stores from examples
   │   ├── components/      # All UI components  
   │   ├── client/          # Socket.IO connection logic
   │   └── index.ts         # Export everything
   ├── types.ts             # Use @langchain/core types directly (no codegen!)
   └── package.json         # Includes @langchain/core dependency
   ```
3. **Use LangChain types for 1:1 mapping**:
   ```typescript
   import type { BaseMessage, RunnableConfig } from '@langchain/core';
   
   // Socket.IO types use LangChain types directly
   export interface SocketMessage {
     message: BaseMessage;  // Same types as Python backend
     config?: RunnableConfig;
   }
   ```
4. **Update example to use new package**:
   ```typescript
   export * from 'svelte-langserve/stores';
   ```
5. **Delete old packages** and codegen complexity

**Benefits:**
- ✅ **Eliminates code duplication**
- ✅ **Removes package maintenance overhead** 
- ✅ **Simpler for users** - one dependency
- ✅ **Single source of truth**

### 1.2 Extract Socket.IO Logic from hooks.server.ts
**Priority: 🔥🔥🔥 Critical**
**Impact: Transforms 657-line monolith into focused modules**

**Current Problem:**
- Single file handling multiple concerns: Socket.IO server, LangServe clients, conversation management, streaming logic

**Actions:**
1. **Create service layer structure**:
   ```
   examples/dashboard/src/lib/services/
   ├── socket-manager.ts        # Socket.IO server setup & event handling
   ├── langserve-client.ts      # LangServe client management  
   ├── conversation-service.ts  # Conversation state & history
   └── streaming-service.ts     # Message streaming logic
   ```

2. **Extract LangServeClientManager**:
   ```typescript
   // services/langserve-client.ts
   export class LangServeClientManager {
     private clients: Map<string, RemoteRunnable>;
     // Move all LangServe-specific logic here
   }
   ```

3. **Extract conversation management**:
   ```typescript
   // services/conversation-service.ts
   export class ConversationService {
     private conversations: Map<string, Conversation>;
     // Move conversation CRUD operations here
   }
   ```

4. **Extract streaming logic**:
   ```typescript
   // services/streaming-service.ts
   export class StreamingService {
     // Move streaming response handling here
   }
   ```

5. **Simplify hooks.server.ts** to just coordinate services:
   ```typescript
   // hooks.server.ts (~50 lines)
   const setupSocketIO: Handle = async ({ event, resolve }) => {
     if (!socketManager && event.platform?.node?.server) {
       socketManager = new SocketManager(
         event.platform.node.server,
         new LangServeClientManager(config),
         new ConversationService(),
         new StreamingService()
       );
     }
     return resolve(event);
   };
   ```

**Files to create:**
- `examples/dashboard/src/lib/services/socket-manager.ts`
- `examples/dashboard/src/lib/services/langserve-client.ts`
- `examples/dashboard/src/lib/services/conversation-service.ts`
- `examples/dashboard/src/lib/services/streaming-service.ts`

**Files to modify:**
- `examples/dashboard/src/hooks.server.ts`

### 1.3 Eliminate Magic Numbers & Centralize Constants
**Priority: 🔥🔥 High**
**Impact: Single source of truth for configuration**

**Current Problem:**
- Constants scattered throughout codebase: `STREAMING_TIMEOUT = 30000`, `MAX_STREAMING_MESSAGES = 10`, etc.

**Actions:**
1. **Create configuration constants**:
   ```typescript
   // examples/dashboard/src/lib/config/constants.ts
   export const STREAMING_CONFIG = {
     TIMEOUT_MS: 30000,
     MAX_CONCURRENT_STREAMS: 10,
     CLEANUP_INTERVAL_MS: 60000,
     MEMORY_CLEANUP_THRESHOLD: 100
   } as const;

   export const SOCKET_CONFIG = {
     RECONNECTION_DELAY_MS: 1000,
     MAX_RECONNECTION_ATTEMPTS: 5,
     PING_TIMEOUT_MS: 60000
   } as const;

   export const PAGINATION_CONFIG = {
     DEFAULT_MESSAGES_PER_PAGE: 50,
     MAX_MESSAGES_PER_PAGE: 200
   } as const;
   ```

2. **Replace magic numbers throughout codebase**
3. **Create environment-specific overrides**:
   ```typescript
   // config/index.ts
   export const config = {
     ...STREAMING_CONFIG,
     ...SOCKET_CONFIG,
     // Allow environment overrides
     TIMEOUT_MS: parseInt(process.env.STREAMING_TIMEOUT_MS) || STREAMING_CONFIG.TIMEOUT_MS
   };
   ```

**Files to create:**
- `examples/dashboard/src/lib/config/constants.ts`
- `examples/dashboard/src/lib/config/index.ts`

### 1.4 Simplify State Management Patterns
**Priority: 🔥🔥 High**
**Impact: More predictable, easier to reason about state**

**Current Problem:**
- Complex Map cleanup with timeouts
- Imperative state updates
- Manual memory management

**Actions:**
1. **Replace complex Map operations with reactive patterns**:
   ```typescript
   // Instead of manual Map cleanup
   const streamingMessages = writable(new Map());
   
   // Use derived stores for computed state
   const displayMessages = derived(
     [messages, streamingMessages], 
     ([$messages, $streaming]) => mergeMessages($messages, $streaming)
   );
   ```

2. **Implement cleanup with AbortController**:
   ```typescript
   // services/cleanup-service.ts
   export class CleanupService {
     private controller = new AbortController();
     
     cleanup(messageId: string) {
       // Centralized cleanup logic
     }
     
     dispose() {
       this.controller.abort();
     }
   }
   ```

3. **Simplify streaming state**:
   ```typescript
   // Replace complex timeout management with reactive cleanup
   const createStreamingStore = () => {
     const { subscribe, update } = writable(new Map());
     
     const addStream = (id: string) => {
       update(map => map.set(id, ''));
       // Auto-cleanup after timeout using derived store
     };
     
     return { subscribe, addStream };
   };
   ```

**Files to modify:**
- Store implementations using Map-based state
- Components handling streaming messages

---

## Phase 2: High Impact Improvements

### 2.1 Centralize Configuration Management
**Priority: 🔥 Medium**
**Impact: Single place for all configuration, easier testing**

**Actions:**
1. **Create unified config system**:
   ```typescript
   // packages/@svelte-langserve/config/src/index.ts
   export const createConfig = (env: Record<string, string | undefined>) => ({
     server: {
       host: env.HOST || '0.0.0.0',
       port: parseInt(env.PORT || '8000'),
       logLevel: env.LOG_LEVEL || 'info'
     },
     langserve: {
       endpoints: parseEndpoints(env),
       timeout: parseInt(env.LANGSERVE_TIMEOUT || '30000')
     },
     socket: {
       path: env.SOCKET_PATH || '/api/socket.io/',
       cors: parseCorsConfig(env)
     }
   });
   ```

2. **Add configuration validation**:
   ```typescript
   // Use Zod or similar for runtime validation
   const ConfigSchema = z.object({
     server: z.object({
       host: z.string(),
       port: z.number().min(1).max(65535)
     })
   });
   ```

3. **Replace scattered environment access**
4. **Create environment-specific config files**

### 2.2 Consolidate Into Single Package
**Priority: 🔥🔥 High** (UPDATED)
**Impact: Massive simplification, reduced maintenance overhead**

**Current Problem:**
```
packages/@svelte-langserve/
├── core/      # 19 lines - tiny wrapper
├── ui/        # 6 components
├── types/     # 68 lines - basic definitions  
└── codegen/   # unclear purpose, probably unnecessary
```
**Total: 46 files, ~1774 lines across 4 packages = massive overhead**

**Target Structure:**
```
packages/svelte-langserve/     # Single package
├── src/
│   ├── lib/
│   │   ├── client/           # Connection & Socket.IO logic
│   │   ├── stores/           # Svelte stores & state management
│   │   ├── components/       # All UI components
│   │   └── index.ts          # Main exports
│   └── types.ts              # All TypeScript definitions
├── package.json              # Single package.json
└── README.md
```

**Actions:**
1. **Create new `packages/svelte-langserve/` directory**
2. **Merge all functionality from 4 packages into one**
3. **Consolidate package.json dependencies** 
4. **Update import paths** in examples to use single package
5. **Remove old package directories**
6. **Simplify build/test/publish workflows**
7. **Update documentation** to reflect single package approach

**Benefits:**
- ✅ **90% less maintenance overhead**
- ✅ **Simpler for users** - one npm install  
- ✅ **Easier publishing** - single package to maintain
- ✅ **Better cohesion** - everything works together
- ✅ **Faster builds** - no cross-package dependencies
- ✅ **No codegen needed** - use LangChain types directly for 1:1 mapping

### 2.3 Improve Error Handling Patterns
**Priority: 🔥 Medium**
**Impact: Consistent error handling across the application**

**Actions:**
1. **Create error types**:
   ```typescript
   // types/errors.ts
   export type LangServeError = 
     | { type: 'CONNECTION_ERROR'; message: string; cause?: Error }
     | { type: 'TIMEOUT_ERROR'; endpoint: string; timeout: number }
     | { type: 'VALIDATION_ERROR'; field: string; message: string };
   ```

2. **Implement error boundaries**:
   ```svelte
   <!-- components/ErrorBoundary.svelte -->
   <script>
     export let fallback: ComponentType;
     // Error boundary implementation
   </script>
   ```

3. **Standardize error handling in services**
4. **Add error recovery mechanisms**

---

## Phase 3: Quality & Polish

### 3.1 Add Comprehensive Development Scripts
**Priority: Medium**
**Impact: Improved developer experience**

**Actions:**
1. **Add development scripts to root package.json**:
   ```json
   {
     "scripts": {
       "dev:full": "docker-compose up -d postgres && concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
       "dev:frontend": "cd examples/dashboard && npm run dev",
       "dev:backend": "cd examples/langserve-backend && uv run serve",
       "test:integration": "playwright test --project=integration",
       "clean:all": "nx run-many -t clean && docker-compose down -v"
     }
   }
   ```

2. **Create docker-compose.dev.yml for development**
3. **Add debugging configurations**

### 3.2 Implement Proper Logging Strategy
**Priority: Medium**
**Impact: Better debugging and monitoring**

**Actions:**
1. **Create logging service**:
   ```typescript
   // services/logger.ts
   export const logger = {
     debug: (message: string, meta?: object) => { /* */ },
     info: (message: string, meta?: object) => { /* */ },
     warn: (message: string, meta?: object) => { /* */ },
     error: (message: string, error?: Error, meta?: object) => { /* */ }
   };
   ```

2. **Replace console.log statements**
3. **Add structured logging for Socket.IO events**
4. **Implement log level configuration**

### 3.3 Add Integration Testing
**Priority: Medium**
**Impact: Confidence in refactoring**

**Actions:**
1. **Create Socket.IO integration tests**:
   ```typescript
   // tests/integration/socket.test.ts
   describe('Socket.IO Integration', () => {
     test('should handle message streaming', async () => {
       // Test real Socket.IO communication
     });
   });
   ```

2. **Add LangServe endpoint tests**
3. **Create test utilities for common scenarios**
4. **Add CI/CD integration test pipeline**

---

## Implementation Guidelines

### Getting Started
1. **Create a feature branch** for each phase
2. **Run existing tests** before and after each change
3. **Update documentation** as you refactor
4. **Test in development environment** thoroughly

### Testing Strategy
- Run `nx run-many -t test` after each change
- Test Socket.IO connections manually during refactoring
- Use Docker Compose to test full integration
- Verify examples still work after package changes

### Rollback Plan
- Keep detailed git history
- Test each phase independently
- Have working backup of current state
- Document any breaking changes

### Success Metrics
- **Lines of code reduction**: Target 30-40% reduction
- **File count reduction**: Consolidate similar functionality
- **Complexity reduction**: Smaller, focused functions
- **Developer experience**: Faster setup and development
- **Maintainability**: Easier to understand and modify

---

## Notes & Considerations

### Breaking Changes
- Store API changes may require example updates
- Service extraction may change import paths
- Configuration centralization affects environment setup

### Dependencies
- Some changes require updating package.json files
- Socket.IO version compatibility
- Svelte 5 rune patterns vs legacy patterns

### Future Considerations
- This refactoring sets foundation for additional features
- Simplified architecture makes testing easier
- Better separation enables independent package publishing
- Cleaner code makes onboarding new developers faster

### Resources
- [Original Architecture Analysis](./ARCHITECTURE.md) (if created)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
- [Socket.IO Documentation](https://socket.io/docs/)
- [LangServe Documentation](https://python.langchain.com/docs/langserve)