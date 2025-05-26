# Error Codes & Responses

Comprehensive reference for all error codes, response formats, and error handling patterns in the LangGraph API system.

## 🚨 Error Response Format

All API endpoints return consistent error responses using the FastAPI standard format:

```json
{
  "detail": "Human-readable error description"
}
```

For Socket.IO events, errors use a structured format:

```typescript
interface SocketError {
  type: ErrorType;
  message: string;
  code?: number;
  retryable: boolean;
  context?: Record<string, unknown>;
  timestamp: number;
}
```

---

## 📋 REST API Error Codes

### Authentication Errors (401)

#### `AUTH_001`: Invalid Credentials
```json
{
  "detail": "Incorrect username or password"
}
```
**Cause**: Invalid username/password combination  
**Solution**: Verify credentials or create new account  
**Retryable**: Yes

#### `AUTH_002`: Token Validation Failed
```json
{
  "detail": "Could not validate credentials"
}
```
**Cause**: Invalid, malformed, or expired JWT token  
**Solution**: Obtain new access token via `/token` endpoint  
**Retryable**: No

#### `AUTH_003`: Missing Authentication
```json
{
  "detail": "Not authenticated"
}
```
**Cause**: No Authorization header provided  
**Solution**: Include `Authorization: Bearer <token>` header  
**Retryable**: No

#### `AUTH_004`: User Account Disabled
```json
{
  "detail": "Inactive user"
}
```
**Cause**: User account has been disabled  
**Solution**: Contact administrator to reactivate account  
**Retryable**: No

### Authorization Errors (403)

#### `AUTH_005`: Insufficient Permissions
```json
{
  "detail": "Insufficient permissions for this operation"
}
```
**Cause**: User lacks required permissions  
**Solution**: Request access or use different account  
**Retryable**: No

### Validation Errors (400)

#### `VAL_001`: Invalid Request Format
```json
{
  "detail": "Invalid request format"
}
```
**Cause**: Malformed JSON or missing required fields  
**Solution**: Check request body format and required fields  
**Retryable**: No

#### `VAL_002`: Invalid Assistant ID
```json
{
  "detail": "Assistant chatbot-invalid not found"
}
```
**Cause**: Requested assistant ID does not exist  
**Solution**: Use valid assistant ID from `/assistants` endpoint  
**Retryable**: No

#### `VAL_003`: Invalid Message Content
```json
{
  "detail": "Message content cannot be empty"
}
```
**Cause**: Empty or null message content  
**Solution**: Provide non-empty message content  
**Retryable**: Yes

#### `VAL_004`: Invalid Configuration
```json
{
  "detail": "Temperature must be between 0.0 and 1.0"
}
```
**Cause**: Configuration parameters outside valid ranges  
**Solution**: Check parameter limits and adjust values  
**Retryable**: Yes

### Resource Errors (404)

#### `RES_001`: Assistant Not Found
```json
{
  "detail": "Assistant {assistant_id} not found"
}
```
**Cause**: Requested assistant does not exist  
**Solution**: Check available assistants via `/assistants`  
**Retryable**: No

#### `RES_002`: User Not Found
```json
{
  "detail": "User not found"
}
```
**Cause**: User account no longer exists  
**Solution**: Re-authenticate or create new account  
**Retryable**: No

### Rate Limiting Errors (429)

#### `RATE_001`: Request Rate Limit Exceeded
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds."
}
```
**Cause**: Too many requests in time window  
**Solution**: Wait for rate limit reset  
**Retryable**: Yes (after delay)

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### Server Errors (500)

#### `SRV_001`: Assistant Invocation Failed
```json
{
  "detail": "Assistant invocation failed: Connection timeout"
}
```
**Cause**: LangGraph execution error or timeout  
**Solution**: Retry request or contact support  
**Retryable**: Yes

#### `SRV_002`: Internal Processing Error
```json
{
  "detail": "Internal server error occurred"
}
```
**Cause**: Unexpected server-side error  
**Solution**: Retry request or contact support  
**Retryable**: Yes

#### `SRV_003`: Service Unavailable
```json
{
  "detail": "LangGraph service temporarily unavailable"
}
```
**Cause**: Backend service outage or maintenance  
**Solution**: Retry later or check status page  
**Retryable**: Yes

---

## 🔌 Socket.IO Error Types

### Connection Errors

#### `CONNECTION_ERROR`
```typescript
{
  "type": "CONNECTION_ERROR",
  "message": "Failed to establish WebSocket connection",
  "retryable": true,
  "context": {
    "reason": "Network timeout",
    "attempts": 3
  }
}
```

#### `AUTH_FAILED`
```typescript
{
  "type": "AUTH_FAILED", 
  "message": "Socket.IO authentication failed",
  "retryable": false,
  "context": {
    "tokenExpired": true
  }
}
```

#### `CONVERSATION_NOT_FOUND`
```typescript
{
  "type": "CONVERSATION_NOT_FOUND",
  "message": "Conversation conv_123 does not exist",
  "retryable": false,
  "context": {
    "conversationId": "conv_123"
  }
}
```

### Message Processing Errors

#### `VALIDATION_ERROR`
```typescript
{
  "type": "VALIDATION_ERROR",
  "message": "Invalid message format or content",
  "retryable": true,
  "context": {
    "field": "endpoints",
    "reason": "Must be non-empty array"
  }
}
```

#### `RATE_LIMIT`
```typescript
{
  "type": "RATE_LIMIT",
  "message": "Message rate limit exceeded",
  "retryable": true,
  "context": {
    "limit": 10,
    "resetTime": 1640995200,
    "userId": "user_123"
  }
}
```

#### `API_ERROR`
```typescript
{
  "type": "API_ERROR",
  "message": "LangGraph API request failed",
  "retryable": true,
  "context": {
    "assistantId": "chatbot",
    "apiStatusCode": 503,
    "originalError": "Service temporarily unavailable"
  }
}
```

#### `TIMEOUT`
```typescript
{
  "type": "TIMEOUT",
  "message": "Assistant response timeout",
  "retryable": true,
  "context": {
    "assistantId": "research-assistant",
    "timeoutMs": 30000,
    "messageId": "msg_456"
  }
}
```

### Assistant-Specific Errors

#### `INVOCATION_ERROR`
```typescript
{
  "type": "INVOCATION_ERROR",
  "message": "Assistant failed to process request",
  "retryable": true,
  "context": {
    "assistantId": "code-assistant",
    "error": "Graph execution failed at node 'analyze'",
    "nodeId": "analyze"
  }
}
```

#### `ASSISTANT_UNAVAILABLE`
```typescript
{
  "type": "ASSISTANT_UNAVAILABLE", 
  "message": "Assistant is temporarily unavailable",
  "retryable": true,
  "context": {
    "assistantId": "data-analyst",
    "reason": "Health check failed",
    "lastHealthy": 1640995000
  }
}
```

### Permission Errors

#### `PERMISSION_DENIED`
```typescript
{
  "type": "PERMISSION_DENIED",
  "message": "Insufficient permissions for this conversation",
  "retryable": false,
  "context": {
    "conversationId": "conv_123",
    "requiredPermission": "conversation:write",
    "userPermissions": ["conversation:read"]
  }
}
```

---

## 🎯 LangGraph-Specific Error Patterns

### Graph Execution Errors

#### Node Execution Failure
```json
{
  "detail": "Graph node 'search_web' failed: API key not configured"
}
```
**Context**: Specific graph node failed during execution  
**Solution**: Check node configuration and dependencies  
**Affects**: `research-assistant`, `data-analyst`

#### State Validation Error
```json
{
  "detail": "Invalid graph state: Missing required field 'query'"
}
```
**Context**: Graph state doesn't meet node requirements  
**Solution**: Ensure proper input formatting  
**Affects**: All assistants with state dependencies

#### Cycle Detection
```json
{
  "detail": "Graph execution cycle detected"
}
```
**Context**: Infinite loop prevention triggered  
**Solution**: Review graph logic or contact support  
**Affects**: Complex graphs with conditional routing

### Memory/Persistence Errors

#### Checkpoint Save Failed
```json
{
  "detail": "Failed to save conversation state: Database connection timeout"
}
```
**Context**: Persistent assistant state save failed  
**Solution**: Retry or continue without persistence  
**Affects**: `chatbot-persistent`

#### Thread State Corruption
```json
{
  "detail": "Corrupted thread state detected, resetting conversation"
}
```
**Context**: Persistent state became invalid  
**Solution**: Conversation will reset automatically  
**Affects**: Persistent assistants only

### Tool Integration Errors

#### Tool Execution Timeout
```json
{
  "detail": "Tool 'web_search' execution timeout after 30 seconds"
}
```
**Context**: External tool took too long to respond  
**Solution**: Retry with simpler query  
**Affects**: `research-assistant`, `data-analyst`

#### Tool Authentication Failed
```json
{
  "detail": "Tool authentication failed: Invalid API key"
}
```
**Context**: External service authentication failed  
**Solution**: Check API key configuration  
**Affects**: Tools requiring external APIs

---

## 🛠 Error Handling Implementation

### Frontend Error Handling

```typescript
// Comprehensive error handler for REST API
class APIErrorHandler {
  static handle(error: any, context?: string): APIError {
    const baseError = {
      timestamp: Date.now(),
      context: context || 'Unknown'
    };

    // Handle HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return {
            ...baseError,
            type: 'AUTHENTICATION_ERROR',
            message: data.detail || 'Authentication required',
            action: 'REDIRECT_TO_LOGIN',
            retryable: false
          };
          
        case 403:
          return {
            ...baseError,
            type: 'AUTHORIZATION_ERROR', 
            message: data.detail || 'Insufficient permissions',
            action: 'SHOW_ERROR',
            retryable: false
          };
          
        case 404:
          return {
            ...baseError,
            type: 'RESOURCE_NOT_FOUND',
            message: data.detail || 'Resource not found',
            action: 'SHOW_ERROR',
            retryable: false
          };
          
        case 429:
          return {
            ...baseError,
            type: 'RATE_LIMIT_EXCEEDED',
            message: data.detail || 'Too many requests',
            action: 'RETRY_AFTER_DELAY',
            retryable: true,
            retryAfter: error.response.headers['retry-after'] || 60
          };
          
        case 500:
          return {
            ...baseError,
            type: 'SERVER_ERROR',
            message: data.detail || 'Internal server error',
            action: 'RETRY_WITH_BACKOFF',
            retryable: true
          };
          
        default:
          return {
            ...baseError,
            type: 'UNKNOWN_ERROR',
            message: data.detail || 'Request failed',
            action: 'SHOW_ERROR',
            retryable: false
          };
      }
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR') {
      return {
        ...baseError,
        type: 'NETWORK_ERROR',
        message: 'Network connection failed',
        action: 'RETRY_WITH_BACKOFF',
        retryable: true
      };
    }

    // Default error
    return {
      ...baseError,
      type: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      action: 'SHOW_ERROR',
      retryable: false
    };
  }
}

// Socket.IO error handler
class SocketErrorHandler {
  static handle(error: SocketError): void {
    console.error(`Socket.IO error [${error.type}]:`, error.message);
    
    switch (error.type) {
      case 'AUTH_FAILED':
        // Redirect to login
        window.location.href = '/login';
        break;
        
      case 'RATE_LIMIT':
        // Show rate limit warning
        this.showRateLimitWarning(error.context.resetTime);
        break;
        
      case 'VALIDATION_ERROR':
        // Show validation error to user
        this.showValidationError(error.message);
        break;
        
      case 'API_ERROR':
      case 'TIMEOUT':
      case 'INVOCATION_ERROR':
        if (error.retryable) {
          // Offer retry option
          this.showRetryableError(error.message, () => {
            // Retry logic here
          });
        } else {
          this.showPermanentError(error.message);
        }
        break;
        
      default:
        this.showGenericError(error.message);
    }
  }
}
```

### Backend Error Responses

```python
# Custom exception classes for LangGraph errors
from fastapi import HTTPException

class LangGraphError(HTTPException):
    """Base class for LangGraph-specific errors."""
    
    def __init__(self, detail: str, status_code: int = 500):
        super().__init__(status_code=status_code, detail=detail)

class AssistantNotFoundError(LangGraphError):
    """Raised when assistant ID is not found."""
    
    def __init__(self, assistant_id: str):
        super().__init__(
            detail=f"Assistant {assistant_id} not found",
            status_code=404
        )

class AssistantInvocationError(LangGraphError):
    """Raised when assistant invocation fails."""
    
    def __init__(self, assistant_id: str, reason: str):
        super().__init__(
            detail=f"Assistant {assistant_id} invocation failed: {reason}",
            status_code=500
        )

class ValidationError(LangGraphError):
    """Raised for request validation errors."""
    
    def __init__(self, field: str, reason: str):
        super().__init__(
            detail=f"Validation error for {field}: {reason}",
            status_code=400
        )

# Error handler middleware
@app.exception_handler(LangGraphError)
async def langgraph_error_handler(request, exc: LangGraphError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_error_handler(request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )
```

---

## 📊 Error Monitoring & Logging

### Error Metrics

**Key Metrics to Track:**
- Error rate by endpoint
- Error rate by assistant
- Authentication failure rate
- Rate limit violations
- Average error resolution time

### Error Categories

```typescript
interface ErrorMetrics {
  authentication: {
    failures: number;
    invalidTokens: number;
    expiredTokens: number;
  };
  assistants: {
    [assistantId: string]: {
      invocationErrors: number;
      timeouts: number;
      unavailable: number;
    };
  };
  rateLimit: {
    violations: number;
    affectedUsers: string[];
  };
  validation: {
    malformedRequests: number;
    invalidParameters: number;
  };
}
```

### Error Response Headers

All error responses include debugging headers:

```http
X-Request-ID: req_123456789
X-Error-Code: AUTH_002
X-Timestamp: 1640995200
X-Retryable: false
X-Rate-Limit-Remaining: 95
```

---

## 🧪 Testing Error Scenarios

### Authentication Errors

```bash
# Test invalid credentials
curl -X POST "http://localhost:8000/token" \
  -d "username=invalid&password=wrong"

# Test expired token
curl -X GET "http://localhost:8000/users/me" \
  -H "Authorization: Bearer expired.jwt.token"

# Test missing token
curl -X GET "http://localhost:8000/assistants"
```

### Assistant Errors

```bash
# Test invalid assistant ID
curl -X POST "http://localhost:8000/assistants/invalid-assistant/invoke" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "test"}'

# Test empty message
curl -X POST "http://localhost:8000/assistants/chatbot/invoke" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": ""}'
```

### Socket.IO Errors

```javascript
// Test authentication failure
socket.emit('authenticate', { token: 'invalid-token' });

// Test invalid conversation
socket.emit('join_conversation', {
  conversationId: 'invalid-conv',
  userId: 'user123',
  endpoints: ['chatbot']
});

// Test validation error
socket.emit('send_message', {
  conversationId: 'conv123',
  content: '',  // Empty content
  endpoints: [] // Empty endpoints array
});
```

---

For implementation examples, see the [REST API Reference](./rest-endpoints.md) and [Socket.IO Events Reference](./socket-events.md).