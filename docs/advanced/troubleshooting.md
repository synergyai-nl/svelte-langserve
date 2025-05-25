# Troubleshooting Guide

Comprehensive guide to diagnosing and fixing common issues in Svelte LangServe applications, with step-by-step solutions and debugging techniques.

## 🔍 Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] **Environment variables** - Are all required API keys set?
- [ ] **Services running** - Are backend and frontend servers both running?
- [ ] **Network connectivity** - Can frontend reach backend?
- [ ] **Browser console** - Any JavaScript errors?
- [ ] **Server logs** - Any backend errors or warnings?
- [ ] **API health** - Do health check endpoints respond?

## 🚨 Common Issues & Solutions

### 1. Connection Problems

#### **Socket.IO Connection Failed**

**Symptoms:**
- Chat interface shows "Connecting..." indefinitely
- Browser console shows WebSocket connection errors
- No real-time updates

**Diagnosis:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if frontend can reach backend
curl http://localhost:3000/api/health

# Check Socket.IO endpoint specifically
curl http://localhost:3000/socket.io/
```

**Solutions:**

**Backend not running:**
```bash
# Start the backend
cd examples/langserve-backend
uv run serve

# Or with auto-reload for development
uv run uvicorn src.svelte_langserve.main:create_app --factory --reload --port 8000
```

**Frontend not running:**
```bash
# Start the frontend
cd examples/dashboard
pnpm dev
```

**CORS issues:**
```python
# Check CORS configuration in backend
# examples/langserve-backend/src/svelte_langserve/app.py

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

**Port conflicts:**
```bash
# Check what's running on ports
lsof -i :3000  # Frontend port
lsof -i :8000  # Backend port

# Kill conflicting processes if needed
kill -9 <PID>
```

#### **Authentication Failures**

**Symptoms:**
- "Authentication failed" errors
- Unable to join conversations
- 401 Unauthorized responses

**Diagnosis:**
```typescript
// Check auth state in browser console
console.log('Auth state:', localStorage.getItem('auth_token'));

// Test token validity
fetch('/api/users/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
}).then(r => console.log('Auth test:', r.status));
```

**Solutions:**

**Invalid credentials:**
```bash
# Use default demo credentials
Username: demo
Password: secret

# Or create new user via registration
```

**Expired token:**
```typescript
// Clear expired tokens
localStorage.removeItem('auth_token');
localStorage.removeItem('auth_user');

// Refresh page and login again
window.location.reload();
```

**JWT secret mismatch:**
```bash
# Ensure SECRET_KEY is consistent between sessions
# Check .env file has SECRET_KEY set
echo $SECRET_KEY

# Generate new secret if needed
openssl rand -hex 32
```

### 2. AI Response Issues

#### **No AI Responses**

**Symptoms:**
- Messages send but no AI replies
- Streaming indicators never appear
- "Waiting for response..." indefinitely

**Diagnosis:**
```bash
# Check API keys are set
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Test LangServe endpoints directly
curl -X POST http://localhost:8000/chatbot/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello, test message"}'

# Check backend logs for errors
docker-compose logs -f langserve-backend
# or
cd examples/langserve-backend && uv run serve --log-level debug
```

**Solutions:**

**Missing API keys:**
```bash
# Set API keys in .env file
cat >> .env << EOF
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
EOF

# Restart backend after setting keys
```

**Invalid API keys:**
```bash
# Test OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Anthropic key  
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "claude-3-sonnet-20240229", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'
```

**Rate limiting:**
```python
# Check if rate limited in backend logs
# Look for errors like "Rate limit exceeded"

# Implement exponential backoff
import time
import random

async def with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await func()
        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            await asyncio.sleep(wait_time)
```

#### **Streaming Not Working**

**Symptoms:**
- Messages appear all at once instead of streaming
- No real-time typing indicators
- Poor user experience

**Diagnosis:**
```typescript
// Check if streaming is enabled in frontend
console.log('Streaming config:', {
  enabled: $configStore.streaming,
  endpoint: selectedEndpoint
});

// Monitor Socket.IO events
socket.onAny((eventName, ...args) => {
  console.log('Socket event:', eventName, args);
});
```

**Solutions:**

**Streaming disabled:**
```typescript
// Enable streaming in config
const config = {
  temperature: 0.7,
  streaming: true,  // Make sure this is true
  maxTokens: 1000
};
```

**LangServe streaming configuration:**
```python
# Ensure LangServe endpoints support streaming
from langserve import add_routes

add_routes(
    app,
    chain,
    path="/chatbot",
    enable_feedback_endpoint=True,
    playground_type="default",
    # Streaming is enabled by default
)
```

**Socket.IO event handling:**
```typescript
// Verify event handlers are set up correctly
socket.on('message_chunk', (chunk) => {
  console.log('Received chunk:', chunk);
  // Update UI with chunk
});

socket.on('message_complete', (message) => {
  console.log('Message complete:', message);
  // Finalize message display
});
```

### 3. Frontend Issues

#### **Components Not Rendering**

**Symptoms:**
- Blank screens or missing components
- TypeScript errors in console
- Theme not applied

**Diagnosis:**
```bash
# Check for build errors
cd examples/dashboard
pnpm check  # TypeScript check
pnpm build  # Build check
```

**Solutions:**

**Missing ThemeProvider:**
```svelte
<!-- ❌ Components without theme context -->
<LangServeFrontend userId="user123" />

<!-- ✅ Wrap with ThemeProvider -->
<ThemeProvider theme={flowbiteTheme}>
  <LangServeFrontend userId="user123" />
</ThemeProvider>
```

**Import errors:**
```typescript
// ❌ Incorrect imports
import { LangServeFrontend } from '$lib/components';

// ✅ Correct imports
import { LangServeFrontend } from 'svelte-langserve';
```

**Package not installed:**
```bash
# Install the package
cd examples/dashboard
pnpm add svelte-langserve

# Or link local package for development
pnpm link ../../packages/svelte-langserve
```

#### **Flowbite Styles Not Applied**

**Symptoms:**
- Components look unstyled
- Missing Flowbite design system
- Broken responsive layout

**Solutions:**

**Missing Flowbite CSS:**
```svelte
<!-- Add to app.html or layout -->
<svelte:head>
  <link 
    href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.css" 
    rel="stylesheet" 
  />
</svelte:head>
```

**Tailwind configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {}
  },
  plugins: [
    require('flowbite/plugin')
  ]
}
```

**Theme not set:**
```svelte
<script>
  import { ThemeProvider, flowbiteTheme } from 'svelte-langserve';
</script>

<!-- Use Flowbite theme specifically -->
<ThemeProvider theme={flowbiteTheme}>
  <slot />
</ThemeProvider>
```

### 4. Performance Issues

#### **Slow Message Loading**

**Symptoms:**
- Long delays when switching conversations
- UI freezes during message history loading
- High memory usage

**Diagnosis:**
```typescript
// Monitor performance
console.time('Message loading');
await loadConversationHistory(conversationId);
console.timeEnd('Message loading');

// Check memory usage
console.log('Memory usage:', performance.memory);
```

**Solutions:**

**Enable pagination:**
```typescript
// Implement message pagination
const MESSAGES_PER_PAGE = 50;

async function loadMoreMessages(conversationId: string, page: number = 0) {
  const response = await fetch(`/api/conversations/${conversationId}/messages?page=${page}&limit=${MESSAGES_PER_PAGE}`);
  return response.json();
}
```

**Virtual scrolling:**
```svelte
<script>
  import { VirtualList } from '@sveltejs/virtual-list';
  
  $: messages = $activeConversation?.messages || [];
</script>

<VirtualList items={messages} let:item>
  <ChatMessage message={item} />
</VirtualList>
```

**Memory cleanup:**
```typescript
// Clean up old conversations
const MAX_CONVERSATIONS_IN_MEMORY = 10;

function cleanupOldConversations(conversations: Conversation[]) {
  if (conversations.length > MAX_CONVERSATIONS_IN_MEMORY) {
    return conversations
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_CONVERSATIONS_IN_MEMORY);
  }
  return conversations;
}
```

#### **High Backend Resource Usage**

**Symptoms:**
- Backend server becomes unresponsive
- High CPU or memory usage
- Slow API responses

**Diagnosis:**
```bash
# Monitor resource usage
top -p $(pgrep -f "uvicorn")
htop

# Check backend logs
docker-compose logs -f langserve-backend

# Monitor database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"
```

**Solutions:**

**Connection pooling:**
```python
# Optimize database connections
DATABASE_CONFIG = {
    "pool_size": 5,
    "max_overflow": 10,
    "pool_timeout": 30,
    "pool_recycle": 3600
}
```

**Memory management:**
```python
# Limit conversation history in memory
MAX_MESSAGES_PER_CONVERSATION = 100

def trim_conversation_history(messages: list) -> list:
    if len(messages) > MAX_MESSAGES_PER_CONVERSATION:
        return messages[-MAX_MESSAGES_PER_CONVERSATION:]
    return messages
```

**Async optimization:**
```python
# Use async/await properly
async def process_multiple_agents(message: str, endpoints: list):
    tasks = [
        process_with_agent(message, endpoint) 
        for endpoint in endpoints
    ]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

## 🛠️ Debugging Tools & Techniques

### Frontend Debugging

#### **Browser Developer Tools**

```typescript
// Add debugging helpers to global scope
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.debugLangServe = {
    store: langServeStore,
    auth: authStore,
    connection: connectionStore,
    
    // Utility functions
    testConnection: () => {
      fetch('/api/health').then(r => console.log('API Health:', r.status));
    },
    
    clearStorage: () => {
      localStorage.clear();
      sessionStorage.clear();
      console.log('Storage cleared');
    },
    
    simulateError: () => {
      langServeStore.setError('Simulated error for testing');
    }
  };
}
```

#### **Socket.IO Debugging**

```typescript
// Enable Socket.IO debugging
localStorage.debug = 'socket.io-client:socket';

// Monitor all events
socket.onAny((eventName, ...args) => {
  console.group(`Socket Event: ${eventName}`);
  console.log('Data:', args);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
});

// Track connection state
socket.on('connect', () => console.log('✅ Socket connected'));
socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason));
socket.on('connect_error', (error) => console.log('🔥 Socket error:', error));
```

### Backend Debugging

#### **Structured Logging**

```python
# Enhanced logging configuration
import structlog
import logging

# Configure structured logging
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage in code
@app.post("/api/send-message")
async def send_message(request: MessageRequest):
    logger.info(
        "Processing message",
        user_id=request.user_id,
        message_length=len(request.content),
        endpoints=request.endpoints
    )
    
    try:
        result = await process_message(request)
        logger.info("Message processed successfully", message_id=result.id)
        return result
    except Exception as e:
        logger.error(
            "Message processing failed",
            error=str(e),
            user_id=request.user_id,
            exc_info=True
        )
        raise
```

#### **Health Check Debugging**

```python
# Comprehensive health checks
@app.get("/health/detailed")
async def detailed_health_check():
    checks = {}
    
    # Database health
    try:
        await db.execute("SELECT 1")
        checks["database"] = {"status": "healthy", "latency_ms": 0}
    except Exception as e:
        checks["database"] = {"status": "unhealthy", "error": str(e)}
    
    # Redis health
    try:
        await redis.ping()
        checks["redis"] = {"status": "healthy"}
    except Exception as e:
        checks["redis"] = {"status": "unhealthy", "error": str(e)}
    
    # AI endpoints health
    checks["ai_endpoints"] = {}
    for endpoint_id, client in langserve_clients.items():
        try:
            start_time = time.time()
            await client.ainvoke({"input": "health check"})
            latency = (time.time() - start_time) * 1000
            checks["ai_endpoints"][endpoint_id] = {
                "status": "healthy",
                "latency_ms": round(latency, 2)
            }
        except Exception as e:
            checks["ai_endpoints"][endpoint_id] = {
                "status": "unhealthy",
                "error": str(e)
            }
    
    overall_status = "healthy" if all(
        check.get("status") == "healthy" 
        for check in checks.values()
        if isinstance(check, dict)
    ) else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }
```

### Database Debugging

```sql
-- Check active connections
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE state = 'active';

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 📊 Monitoring & Alerting

### Application Metrics

```typescript
// Frontend metrics collection
class MetricsCollector {
  private static instance: MetricsCollector;
  
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }
  
  trackEvent(name: string, properties: Record<string, any> = {}) {
    const event = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };
    
    // Send to analytics service
    this.sendMetric(event);
  }
  
  trackTiming(name: string, duration: number, properties: Record<string, any> = {}) {
    this.trackEvent(`timing.${name}`, {
      ...properties,
      duration_ms: duration
    });
  }
  
  trackError(error: Error, context: Record<string, any> = {}) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }
  
  private sendMetric(event: any) {
    // Send to your metrics service (Mixpanel, Amplitude, etc.)
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(err => console.warn('Failed to send metric:', err));
  }
}

// Usage throughout the app
const metrics = MetricsCollector.getInstance();

// Track user actions
metrics.trackEvent('message_sent', {
  conversation_id: conversationId,
  endpoint: selectedEndpoint,
  message_length: message.length
});

// Track performance
const startTime = performance.now();
await sendMessage(message);
metrics.trackTiming('message_send', performance.now() - startTime);
```

### Error Tracking

```python
# Backend error tracking with Sentry
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration

if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[
            FastApiIntegration(auto_session_tracking=False),
            AsyncioIntegration(),
        ],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development")
    )

# Custom error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the error
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        method=request.method,
        exc_info=True
    )
    
    # Report to Sentry if configured
    if os.getenv("SENTRY_DSN"):
        sentry_sdk.capture_exception(exc)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }
    )
```

## 🆘 Getting Help

### Self-Service Resources

1. **Documentation**
   - [Quick Start Guide](../getting-started/quick-start.md)
   - [Component Reference](../reference/components.md)
   - [API Documentation](../reference/api/)

2. **Logs & Diagnostics**
   ```bash
   # Collect diagnostic information
   ./scripts/collect-diagnostics.sh
   ```

3. **Community Resources**
   - [GitHub Discussions](https://github.com/synergyai-nl/svelte-langserve/discussions)
   - [Issue Tracker](https://github.com/synergyai-nl/svelte-langserve/issues)

### Reporting Issues

When reporting issues, include:

```bash
# System information
echo "OS: $(uname -a)"
echo "Node: $(node --version)"
echo "Python: $(python --version)"
echo "Docker: $(docker --version)"

# Application versions
echo "Frontend dependencies:"
cd examples/dashboard && pnpm list --depth=0

echo "Backend dependencies:"
cd examples/langserve-backend && uv pip list

# Recent logs
echo "Recent backend logs:"
docker-compose logs --tail=50 langserve-backend

echo "Recent frontend logs:"
# Browser console logs
```

### Debug Information Collection

```bash
#!/bin/bash
# scripts/collect-diagnostics.sh

echo "=== Svelte LangServe Diagnostics ==="
echo "Timestamp: $(date)"
echo "User: $(whoami)"
echo

echo "=== Environment ==="
echo "OS: $(uname -a)"
echo "Node: $(node --version 2>/dev/null || echo 'Not installed')"
echo "Python: $(python --version 2>/dev/null || echo 'Not installed')"
echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
echo

echo "=== Service Status ==="
echo "Frontend (port 3000): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/health || echo 'Not responding')"
echo "Backend (port 8000): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health || echo 'Not responding')"
echo

echo "=== Environment Variables ==="
echo "NODE_ENV: ${NODE_ENV:-'Not set'}"
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:+Set}${OPENAI_API_KEY:-Not set}"
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+Set}${ANTHROPIC_API_KEY:-Not set}"
echo

echo "=== Recent Logs ==="
if command -v docker-compose >/dev/null; then
    echo "Backend logs (last 20 lines):"
    docker-compose logs --tail=20 langserve-backend 2>/dev/null || echo "No Docker logs available"
else
    echo "Docker Compose not available"
fi

echo
echo "=== Diagnostics Complete ==="
echo "Please include this output when reporting issues."
```

This troubleshooting guide covers the most common issues you'll encounter with Svelte LangServe and provides systematic approaches to diagnosing and fixing them. Keep this guide handy for quick reference during development and deployment.