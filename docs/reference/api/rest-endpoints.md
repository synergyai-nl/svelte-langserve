# REST API Reference

Complete reference for all REST endpoints in the LangGraph Backend API.

## 🔗 Base URL

```
http://localhost:8000  # Development
https://your-domain.com  # Production
```

## 🔐 Authentication

> **⚠️ Demo Authentication Notice**  
> The current authentication system is a **proof of concept** for demonstration purposes only. The Python backend includes a simple username/password system with hardcoded demo users. In production environments, this will be replaced with proper OAuth integration, eliminating username/password handling entirely.

All endpoints (except `/token`) require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Demo Authentication

**Available Demo Users:**
- Username: `demo`, Password: `secret`
- Username: `admin`, Password: `secret`

### Getting an Access Token

Use the `/token` endpoint to authenticate and receive a JWT token:

```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo&password=secret"
```

> **🚀 Future Enhancement**  
> This authentication flow will be replaced with OAuth 2.0/OIDC integration (Google, GitHub, Microsoft, etc.) for production deployments. No username/password management will be required.

---

## 📋 API Endpoints

### Authentication Endpoints

#### `POST /token`

Authenticate user and receive JWT access token.

> **Note:** This is a demonstration endpoint. Production systems will use OAuth callback flows instead.

**Request:**
```http
POST /token
Content-Type: application/x-www-form-urlencoded

username=demo&password=secret
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Status Codes:**
- `200 OK` - Authentication successful
- `401 Unauthorized` - Invalid credentials

**Example:**
```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo&password=secret"
```

#### `GET /users/me`

Get information about the currently authenticated user.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response:**
```json
{
  "username": "demo",
  "email": "demo@example.com",
  "full_name": "Demo User",
  "disabled": false
}
```

**Status Codes:**
- `200 OK` - User information retrieved
- `401 Unauthorized` - Invalid or missing token

**Example:**
```bash
curl -X GET "http://localhost:8000/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### Assistant Management

#### `GET /assistants`

List all available AI assistants with their metadata.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response:**
```json
{
  "chatbot": {
    "name": "General Chatbot",
    "description": "General-purpose conversational AI assistant",
    "type": "chat",
    "supports_streaming": true,
    "supports_persistence": false
  },
  "chatbot-persistent": {
    "name": "Persistent Chatbot", 
    "description": "General-purpose conversational AI with memory persistence",
    "type": "chat",
    "supports_streaming": true,
    "supports_persistence": true
  },
  "code-assistant": {
    "name": "Code Assistant",
    "description": "Specialized coding and development assistant",
    "type": "chat",
    "supports_streaming": true,
    "supports_persistence": false
  },
  "creative-writer": {
    "name": "Creative Writer",
    "description": "Creative writing and storytelling assistant", 
    "type": "chat",
    "supports_streaming": true,
    "supports_persistence": false
  },
  "data-analyst": {
    "name": "Data Analyst",
    "description": "Data analysis and research with search tools",
    "type": "chat", 
    "supports_streaming": true,
    "supports_persistence": false,
    "has_tools": true
  },
  "research-assistant": {
    "name": "Research Assistant",
    "description": "Research assistant with web search capabilities",
    "type": "chat",
    "supports_streaming": true, 
    "supports_persistence": false,
    "has_tools": true
  }
}
```

**Status Codes:**
- `200 OK` - Assistants listed successfully
- `401 Unauthorized` - Authentication required

**Example:**
```bash
curl -X GET "http://localhost:8000/assistants" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### `GET /assistants/{assistant_id}`

Get detailed information about a specific assistant.

**Parameters:**
- `assistant_id` (path) - ID of the assistant (`chatbot`, `code-assistant`, etc.)

**Headers:**
```http
Authorization: Bearer {token}
```

**Response:**
```json
{
  "name": "General Chatbot",
  "description": "General-purpose conversational AI assistant",
  "type": "chat",
  "supports_streaming": true,
  "supports_persistence": false
}
```

**Status Codes:**
- `200 OK` - Assistant information retrieved
- `401 Unauthorized` - Authentication required  
- `404 Not Found` - Assistant ID not found

**Example:**
```bash
curl -X GET "http://localhost:8000/assistants/chatbot" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### `POST /assistants/{assistant_id}/invoke`

Invoke an AI assistant to process a message and get a response.

**Parameters:**
- `assistant_id` (path) - ID of the assistant to invoke

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Explain quantum computing in simple terms",
  "thread_id": "user123_thread_456",
  "config": {
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

**Request Schema:**
- `message` (string, required) - User message to process
- `thread_id` (string, optional) - Thread ID for persistent assistants
- `config` (object, optional) - Assistant configuration parameters

**Response:**
```json
{
  "response": "Quantum computing is a revolutionary approach to computation that leverages the principles of quantum mechanics...",
  "thread_id": "user123_thread_456",
  "metadata": {
    "assistant_id": "chatbot"
  }
}
```

**Status Codes:**
- `200 OK` - Assistant response generated successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Assistant ID not found
- `500 Internal Server Error` - Assistant invocation failed

**Example:**
```bash
curl -X POST "http://localhost:8000/assistants/chatbot/invoke" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?",
    "config": {"temperature": 0.8}
  }'
```

---

### Health & Status

#### `GET /health`

Get overall system health status including all assistants.

**Response:**
```json
{
  "status": "healthy",
  "assistants": [
    "chatbot",
    "chatbot-persistent", 
    "code-assistant",
    "creative-writer",
    "data-analyst",
    "research-assistant"
  ],
  "assistant_health": {
    "chatbot": {
      "status": "healthy",
      "error": null
    },
    "code-assistant": {
      "status": "healthy", 
      "error": null
    }
  },
  "version": "1.0",
  "auth_required": true,
  "backend_type": "langgraph"
}
```

**Response Fields:**
- `status` - Overall system status (`healthy` or `degraded`)
- `assistants` - List of available assistant IDs
- `assistant_health` - Health status for each assistant
- `version` - API version
- `auth_required` - Whether authentication is required
- `backend_type` - Type of backend system

**Status Codes:**
- `200 OK` - Health check completed

**Example:**
```bash
curl -X GET "http://localhost:8000/health"
```

#### `GET /assistants/{assistant_id}/health`

Check health status of a specific assistant.

**Parameters:**
- `assistant_id` (path) - ID of the assistant to check

**Headers:**
```http
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "healthy",
  "error": null
}
```

**Status Codes:**
- `200 OK` - Health check completed
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Assistant ID not found

**Example:**
```bash
curl -X GET "http://localhost:8000/assistants/chatbot/health" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### System Information

#### `GET /`

Get API information and available endpoints.

**Response:**
```json
{
  "message": "LangGraph Backend for Socket.IO Frontend",
  "documentation": "/docs",
  "health": "/health", 
  "backend_type": "langgraph",
  "available_assistants": {
    "chatbot": {
      "name": "General Chatbot",
      "description": "General-purpose conversational AI assistant",
      "endpoint": "/assistants/chatbot/invoke",
      "info_endpoint": "/assistants/chatbot",
      "health_endpoint": "/assistants/chatbot/health",
      "supports_streaming": true,
      "supports_persistence": false
    }
  },
  "api_endpoints": {
    "list_assistants": "/assistants",
    "invoke_assistant": "/assistants/{assistant_id}/invoke", 
    "assistant_info": "/assistants/{assistant_id}",
    "assistant_health": "/assistants/{assistant_id}/health"
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:8000/"
```

---

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error description message"
}
```

### Common Error Codes

#### 400 Bad Request
Invalid request parameters or malformed JSON.

```json
{
  "detail": "Invalid request format"
}
```

#### 401 Unauthorized  
Missing, expired, or invalid authentication token.

```json
{
  "detail": "Could not validate credentials"
}
```

#### 404 Not Found
Requested resource (assistant, endpoint) does not exist.

```json
{
  "detail": "Assistant chatbot-invalid not found"
}
```

#### 500 Internal Server Error
Server-side error during processing.

```json
{
  "detail": "Assistant invocation failed: Connection timeout"
}
```

---

## 🔧 Configuration Parameters

### Assistant Configuration

When invoking assistants, you can provide configuration parameters:

```json
{
  "message": "Your message here",
  "config": {
    "temperature": 0.7,        // 0.0-1.0, controls randomness
    "max_tokens": 500,         // Maximum response length
    "top_p": 0.9,             // Nucleus sampling parameter
    "frequency_penalty": 0.0,  // Penalize repeated tokens
    "presence_penalty": 0.0    // Penalize new topics
  }
}
```

### Thread Management

For persistent assistants, use thread IDs to maintain conversation context:

```json
{
  "message": "Continue our previous conversation",
  "thread_id": "user123_conversation_456"
}
```

**Thread ID Format:**
- Recommended: `{user_id}_{conversation_id}_{timestamp}`
- Must be consistent across requests in the same conversation
- Only works with assistants where `supports_persistence: true`

---

## 📊 Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Rate Limit**: 100 requests per minute per user
- **Burst Limit**: 10 requests per second
- **Headers**: Rate limit information included in response headers

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85  
X-RateLimit-Reset: 1640995200
```

When rate limit is exceeded:
```json
{
  "detail": "Rate limit exceeded. Try again in 60 seconds."
}
```

---

## 🔄 Integration Examples

### Complete Authentication Flow

```javascript
// 1. Get access token (demo authentication)
const authResponse = await fetch('http://localhost:8000/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'username=demo&password=secret'
});

const { access_token } = await authResponse.json();

// 2. Use token for API calls
const assistantsResponse = await fetch('http://localhost:8000/assistants', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const assistants = await assistantsResponse.json();

// 3. Invoke an assistant
const invokeResponse = await fetch('http://localhost:8000/assistants/chatbot/invoke', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello, how are you?',
    config: { temperature: 0.7 }
  })
});

const result = await invokeResponse.json();
console.log(result.response);
```

### Error Handling

```javascript
async function invokeAssistant(assistantId, message) {
  try {
    const response = await fetch(`/assistants/${assistantId}/invoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 401:
          // Redirect to login (in demo) or trigger OAuth flow (in production)
          window.location.href = '/login';
          break;
        case 404:
          throw new Error(`Assistant ${assistantId} not found`);
        case 500:
          throw new Error(`Server error: ${error.detail}`);
        default:
          throw new Error(`Request failed: ${error.detail}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

---

## 🛠 Development & Testing

### Interactive API Documentation

The FastAPI backend automatically generates interactive documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Testing with curl

```bash
# Set variables
TOKEN="your-jwt-token-here"
BASE_URL="http://localhost:8000"

# List assistants
curl -X GET "$BASE_URL/assistants" \
  -H "Authorization: Bearer $TOKEN"

# Invoke assistant
curl -X POST "$BASE_URL/assistants/chatbot/invoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'

# Check health
curl -X GET "$BASE_URL/health"
```

### Testing with Python

```python
import requests

# Demo authentication
auth_response = requests.post('http://localhost:8000/token', data={
    'username': 'demo',
    'password': 'secret'
})
token = auth_response.json()['access_token']

# API requests
headers = {'Authorization': f'Bearer {token}'}

# List assistants
assistants = requests.get('http://localhost:8000/assistants', headers=headers)
print(assistants.json())

# Invoke assistant
response = requests.post('http://localhost:8000/assistants/chatbot/invoke', 
    headers=headers,
    json={'message': 'Hello!'}
)
print(response.json()['response'])
```

---

## 🚀 Production Considerations

> **Important:** This backend is a demonstration system. For production deployments:

- **Authentication**: Replace demo auth with OAuth 2.0/OIDC providers
- **Database**: Replace in-memory user store with proper database
- **Security**: Implement proper rate limiting, input validation, and security headers
- **Monitoring**: Add proper logging, metrics, and health monitoring
- **Scalability**: Consider load balancing and horizontal scaling

For real-time communication and streaming responses, see the [Socket.IO Events Reference](./socket-events.md).