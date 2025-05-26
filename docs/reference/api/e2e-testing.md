# E2E Testing Guide

This document describes the comprehensive End-to-End testing infrastructure for validating the full message flow from UI to backend and back.

## Overview

Our E2E testing system validates the complete communication stack:
- **Frontend UI** (SvelteKit) 
- **Socket.IO** real-time communication
- **Backend API** (FastAPI)
- **LangGraph agents** (including test-echo agent)

## Test-Echo Agent 🤖

The **test-echo agent** is specifically designed for E2E testing without requiring API keys:

```python
# Example usage:
# Input: "Hello world"
# Output: "Echo: Hello world"
```

### Key Features:
- ✅ **No API dependencies** - works without OpenAI/Anthropic keys
- ✅ **Predictable responses** - perfect for automated testing  
- ✅ **Same LangGraph interface** - follows existing agent patterns
- ✅ **CI/CD ready** - runs in any environment

## Running E2E Tests

### 1. Backend-Only Tests

Test the echo agent in isolation:

```bash
# Via Nx
nx run langgraph-backend:test:echo

# Or directly
cd examples/langgraph-backend
uv run python scripts/test-echo-agent.py
```

### 2. API Integration Tests

Test backend API with echo agent:

```bash
# Requires backend running on port 8000
cd examples/dashboard
npm run test:e2e:echo
```

### 3. Full-Stack Integration Tests

Complete E2E tests with service orchestration:

```bash
# Via Nx (recommended)
nx run dashboard:test:e2e:full-stack

# Or via npm script
cd examples/dashboard  
npm run test:e2e:full-stack
```

### 4. All E2E Tests

Run all E2E tests including existing ones:

```bash
# Standard E2E tests (assumes services are running)
nx run dashboard:test:e2e

# Full stack with echo tests
nx run dashboard:test:e2e:full-stack
```

## Test Structure

### Backend Tests (`echo-agent-basic.test.ts`)

Tests the core backend functionality:
- ✅ Authentication with demo credentials
- ✅ Test-echo agent availability via API
- ✅ Message echo functionality
- ✅ Health checks and system status
- ✅ Error handling

### Frontend Integration Tests (`full-message-flow.test.ts`)

Tests the complete UI flow:
- ✅ Page loading and UI elements
- ✅ Authentication flow
- ✅ Agent selection (test-echo)
- ✅ Message sending and receiving
- ✅ Conversation persistence
- ✅ Connection stability

## CI/CD Integration

### GitHub Actions

The CI already includes E2E testing:

```yaml
# .github/workflows/ci.yml
e2e:
  name: End-to-End Tests
  runs-on: ubuntu-latest
  needs: [changes, frontend, backend, quality]
  # ... starts services and runs tests
```

### Environment Variables

For CI/CD, these environment variables are automatically set:

```bash
# Mock API keys (sufficient for test-echo agent)
OPENAI_API_KEY=test-key
ANTHROPIC_API_KEY=test-key
SECRET_KEY=test-secret-key-for-testing

# Service URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:4173
```

## Local Development

### Prerequisites

- Node.js 22+ with pnpm
- Python 3.12+ with uv
- Playwright browsers: `pnpm exec playwright install`

### Quick Start

1. **Run backend echo test:**
   ```bash
   nx run langgraph-backend:test:echo
   ```

2. **Run full-stack E2E:**
   ```bash
   nx run dashboard:test:e2e:full-stack
   ```

### Manual Service Setup

If you prefer manual control:

1. **Start backend:**
   ```bash
   cd examples/langgraph-backend
   export OPENAI_API_KEY=test-key
   export ANTHROPIC_API_KEY=test-key  
   uv run uvicorn src.svelte_langgraph.main:create_app --factory --port 8000
   ```

2. **Start frontend:**
   ```bash
   cd examples/dashboard
   npm run build && npm run preview
   ```

3. **Run tests:**
   ```bash
   npm run test:e2e
   ```

## Test Configuration

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000,
  expect: { timeout: 10000 },
  retries: process.env.CI ? 2 : 0,
  // ...
});
```

### Service Orchestration

The `run-e2e-with-services.sh` script handles:
- ✅ Service startup and health checks
- ✅ Port conflict resolution  
- ✅ Graceful cleanup on exit
- ✅ Environment variable setup
- ✅ Test execution and reporting

## Troubleshooting

### Common Issues

**1. Port conflicts:**
```bash
# The script automatically handles this, but manually:
pkill -f "uvicorn.*8000"
pkill -f "vite preview.*4173"
```

**2. Backend fails to start:**
```bash
# Check if test-echo agent works in isolation:
nx run langgraph-backend:test:echo
```

**3. Frontend build issues:**
```bash
# Ensure dependencies are built:
nx run svelte-langgraph:build
nx run dashboard:build
```

**4. Test timeouts:**
```bash
# Increase timeouts in playwright.config.ts
# Or run with more verbose output:
npx playwright test --headed --debug
```

### Debug Information

The full-stack script provides detailed logging:

```bash
# View service logs
cat examples/dashboard/backend-e2e.log
cat examples/dashboard/frontend-e2e.log

# Check service health manually
curl http://localhost:8000/health
curl http://localhost:4173
```

### Test Agent Validation

Verify the test-echo agent works correctly:

```bash
# Direct test
nx run langgraph-backend:test:echo

# API test  
curl -X POST http://localhost:8000/token \
  -d "username=demo&password=secret"

curl -X POST http://localhost:8000/assistants/test-echo/invoke \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## Adding New E2E Tests

### 1. Backend API Tests

Add to `echo-agent-basic.test.ts`:

```typescript
test('should handle new functionality', async ({ request }) => {
  // Authenticate
  const authResponse = await request.post(`${BACKEND_URL}/token`, {
    form: { username: 'demo', password: 'secret' }
  });
  const { access_token } = await authResponse.json();
  
  // Test new endpoint
  const response = await request.post(`${BACKEND_URL}/assistants/test-echo/new-feature`, {
    headers: { 'Authorization': `Bearer ${access_token}` },
    data: { /* test data */ }
  });
  
  expect(response.ok()).toBeTruthy();
});
```

### 2. Frontend Integration Tests

Add to `full-message-flow.test.ts`:

```typescript
test('should test new UI feature', async ({ page }) => {
  await page.goto('/');
  
  // Interact with new UI elements
  await page.locator('[data-testid="new-feature"]').click();
  
  // Verify expected behavior
  await expect(page.locator('[data-result="success"]')).toBeVisible();
});
```

### 3. Service Integration

For tests requiring both services, use the full-stack script:

```bash
# Add new test files to e2e/ directory
# They will be automatically included in the full-stack run
```

## Performance Considerations

- **Parallel execution:** Disabled in CI for stability
- **Caching:** Nx caches test results where possible
- **Retries:** Configured for flaky network conditions
- **Timeouts:** Generous timeouts for CI environments

## Best Practices

1. **Use test-echo agent** for predictable responses
2. **Test error conditions** as well as happy paths  
3. **Keep tests isolated** - don't rely on specific order
4. **Use data-testid** attributes for reliable selectors
5. **Mock external dependencies** when possible
6. **Clean up resources** after tests complete

This E2E testing infrastructure ensures reliable validation of the complete LangGraph integration without requiring external API dependencies.