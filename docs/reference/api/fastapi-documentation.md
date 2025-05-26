# FastAPI Auto-Generated Documentation

Guide for enhancing the automatically generated OpenAPI documentation in the LangGraph FastAPI backend.

## 🚀 Accessing Auto-Generated Docs

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

These are dynamically generated from your FastAPI code and stay in sync with your actual implementation.

## 📝 Enhancing Documentation

### Application Metadata

Update the FastAPI app configuration in `app.py`:

```python
from fastapi import FastAPI

app = FastAPI(
    title="LangGraph Backend API",
    version="1.0.0",
    description="""
    REST API for the LangGraph Backend system providing access to multiple AI assistants.
    
    ## 🚨 Demo Authentication Notice
    
    This API currently uses **demo authentication** for proof of concept. Production deployments 
    will use OAuth 2.0/OIDC providers instead of username/password authentication.
    
    **Available Demo Users:**
    - Username: `demo`, Password: `secret`
    - Username: `admin`, Password: `secret`
    
    ## 🔗 Additional Resources
    
    - **Socket.IO Events**: For real-time communication patterns
    - **Authentication Guide**: For current demo auth and future OAuth plans
    - **Error Codes**: For comprehensive error handling reference
    """,
    contact={
        "name": "API Support",
        "url": "https://github.com/synergyai-nl/svelte-langgraph",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    servers=[
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.your-domain.com", 
            "description": "Production server"
        }
    ]
)
```

### Endpoint Documentation

Enhance individual endpoints with detailed documentation:

```python
from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

# Enhanced request/response models
class AssistantRequest(BaseModel):
    message: str = Field(
        ..., 
        min_length=1,
        description="User message to process",
        example="Explain quantum computing in simple terms"
    )
    thread_id: Optional[str] = Field(
        None,
        description="Thread ID for persistent assistants (maintains conversation context)",
        example="user123_thread_456"
    )
    config: Optional[Dict[str, Any]] = Field(
        None,
        description="Assistant configuration parameters",
        example={
            "temperature": 0.7,
            "max_tokens": 500,
            "top_p": 0.9
        }
    )

class AssistantResponse(BaseModel):
    response: str = Field(
        ...,
        description="Generated response from the assistant",
        example="Quantum computing is a revolutionary approach to computation..."
    )
    thread_id: Optional[str] = Field(
        None,
        description="Thread ID used (for persistent assistants)",
        example="user123_thread_456"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional response metadata",
        example={
            "assistant_id": "chatbot",
            "tokens_used": 150,
            "response_time_ms": 1250
        }
    )

# Enhanced endpoint with comprehensive documentation
@app.post(
    "/assistants/{assistant_id}/invoke",
    response_model=AssistantResponse,
    summary="Invoke an AI assistant",
    description="""
    Send a message to an AI assistant and receive a response.
    
    ## Configuration Options
    
    - **temperature**: Controls randomness (0.0-1.0)
    - **max_tokens**: Maximum response length  
    - **top_p**: Nucleus sampling parameter
    - **frequency_penalty**: Penalize repeated tokens (-2.0 to 2.0)
    - **presence_penalty**: Penalize new topics (-2.0 to 2.0)
    
    ## Thread Management
    
    For persistent assistants (like `chatbot-persistent`), use consistent `thread_id` 
    values to maintain conversation context across requests.
    
    ## Available Assistants
    
    - `chatbot`: General-purpose conversational AI
    - `chatbot-persistent`: Chatbot with memory persistence  
    - `code-assistant`: Programming help and code generation
    - `creative-writer`: Creative writing and storytelling
    - `data-analyst`: Data analysis with search tools
    - `research-assistant`: Web search and research capabilities
    """,
    responses={
        200: {
            "description": "Assistant response generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "response": "Quantum computing is a revolutionary approach to computation that leverages the principles of quantum mechanics...",
                        "thread_id": "user123_thread_456",
                        "metadata": {
                            "assistant_id": "chatbot",
                            "tokens_used": 150,
                            "response_time_ms": 1250
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid request parameters",
            "content": {
                "application/json": {
                    "example": {"detail": "Message content cannot be empty"}
                }
            }
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {"detail": "Could not validate credentials"}
                }
            }
        },
        404: {
            "description": "Assistant not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Assistant chatbot-invalid not found"}
                }
            }
        },
        500: {
            "description": "Assistant invocation failed",
            "content": {
                "application/json": {
                    "example": {"detail": "Assistant invocation failed: Connection timeout"}
                }
            }
        }
    },
    tags=["Assistants"]
)
async def invoke_assistant(
    assistant_id: str = Path(
        ...,
        description="ID of the assistant to invoke",
        example="chatbot"
    ),
    request: AssistantRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Invoke a LangGraph assistant with the provided message and configuration.
    
    This endpoint supports both simple one-off requests and persistent conversations
    using thread IDs for context management.
    """
    # Implementation here...
```

### Authentication Documentation

```python
@app.post(
    "/token",
    response_model=Token,
    summary="Get JWT access token",
    description="""
    Authenticate with username/password and receive a JWT access token.
    
    ## ⚠️ Demo Authentication Notice
    
    This is **demonstration authentication only**. Production systems will use 
    OAuth 2.0/OIDC providers instead of username/password authentication.
    
    ## Available Demo Users
    
    - **Username**: `demo`, **Password**: `secret`
    - **Username**: `admin`, **Password**: `secret`
    
    ## Token Usage
    
    Include the returned token in the Authorization header for subsequent requests:
    ```
    Authorization: Bearer <access_token>
    ```
    """,
    responses={
        200: {
            "description": "Authentication successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "bearer"
                    }
                }
            }
        },
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {"detail": "Incorrect username or password"}
                }
            }
        }
    },
    tags=["Authentication"]
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Demo authentication endpoint for obtaining JWT tokens.
    
    In production, this will be replaced with OAuth 2.0/OIDC flows.
    """
    # Implementation here...
```

### Enhanced Error Models

```python
from enum import Enum

class ErrorCode(str, Enum):
    # Authentication errors
    AUTH_INVALID_CREDENTIALS = "AUTH_001"
    AUTH_TOKEN_INVALID = "AUTH_002"
    AUTH_MISSING = "AUTH_003"
    AUTH_USER_DISABLED = "AUTH_004"
    
    # Validation errors  
    VAL_INVALID_FORMAT = "VAL_001"
    VAL_INVALID_ASSISTANT = "VAL_002"
    VAL_EMPTY_MESSAGE = "VAL_003"
    VAL_INVALID_CONFIG = "VAL_004"
    
    # Server errors
    SRV_INVOCATION_FAILED = "SRV_001"
    SRV_INTERNAL_ERROR = "SRV_002"
    SRV_UNAVAILABLE = "SRV_003"

class DetailedError(BaseModel):
    detail: str = Field(..., description="Human-readable error message")
    code: Optional[ErrorCode] = Field(None, description="Machine-readable error code")
    retryable: Optional[bool] = Field(None, description="Whether the request can be retried")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional error context")

# Use in endpoint responses
@app.get("/assistants/{assistant_id}")
async def get_assistant_info(assistant_id: str):
    if assistant_id not in assistant_manager.assistants:
        raise HTTPException(
            status_code=404,
            detail=DetailedError(
                detail=f"Assistant {assistant_id} not found",
                code=ErrorCode.VAL_INVALID_ASSISTANT,
                retryable=False,
                context={"valid_assistants": list(assistant_manager.assistants.keys())}
            ).dict()
        )
```

### Response Tags and Organization

```python
# Organize endpoints with tags
tags_metadata = [
    {
        "name": "Authentication",
        "description": """
        Demo authentication endpoints for obtaining and validating JWT tokens.
        
        **Important:** This is demonstration authentication only. Production systems 
        will use OAuth 2.0/OIDC providers instead.
        """,
    },
    {
        "name": "System", 
        "description": "System information and health monitoring endpoints",
    },
    {
        "name": "Assistants",
        "description": """
        AI assistant management and invocation endpoints.
        
        These endpoints provide access to 6 specialized AI assistants built with LangGraph.
        """,
    },
]

app = FastAPI(
    title="LangGraph Backend API",
    # ... other config
    openapi_tags=tags_metadata
)
```

### Path Parameters Documentation

```python
from fastapi import Path

@app.get("/assistants/{assistant_id}")
async def get_assistant_info(
    assistant_id: str = Path(
        ...,
        description="ID of the assistant",
        example="chatbot",
        regex="^(chatbot|chatbot-persistent|code-assistant|creative-writer|data-analyst|research-assistant)$"
    )
):
    """Get detailed information about a specific assistant."""
    pass
```

## 🏷️ Implementation Example

Here's how to enhance the existing `app.py` file:

```python
# examples/langgraph-backend/src/svelte_langgraph/app.py

from fastapi import FastAPI, Depends, HTTPException, status, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    app = FastAPI(
        title="LangGraph Backend API",
        version="1.0.0",
        description="""
        REST API for the LangGraph Backend system providing access to multiple AI assistants.
        
        ## 🚨 Demo Authentication Notice
        
        This API currently uses **demo authentication** for proof of concept. Production 
        deployments will use OAuth 2.0/OIDC providers instead of username/password authentication.
        
        **Available Demo Users:**
        - Username: `demo`, Password: `secret`  
        - Username: `admin`, Password: `secret`
        
        ## 🤖 Available Assistants
        
        - **chatbot**: General-purpose conversational AI
        - **chatbot-persistent**: Chatbot with memory persistence
        - **code-assistant**: Programming help and code generation  
        - **creative-writer**: Creative writing and storytelling
        - **data-analyst**: Data analysis with search tools
        - **research-assistant**: Web search and research capabilities
        
        ## 🔗 Additional Resources
        
        - [Socket.IO Events Documentation](../docs/reference/api/socket-events.md)
        - [Authentication Workflow Guide](../docs/guides/authentication-flow.md)
        - [Error Codes Reference](../docs/reference/api/error-codes.md)
        """,
        contact={
            "name": "API Support",
            "url": "https://github.com/synergyai-nl/svelte-langgraph",
        },
        license_info={
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT",
        },
        openapi_tags=[
            {
                "name": "Authentication",
                "description": """
                Demo authentication endpoints for obtaining and validating JWT tokens.
                
                **Important:** This is demonstration authentication only. Production systems 
                will use OAuth 2.0/OIDC providers instead.
                """,
            },
            {
                "name": "System",
                "description": "System information and health monitoring endpoints",
            },
            {
                "name": "Assistants", 
                "description": "AI assistant management and invocation endpoints",
            },
        ]
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Setup routes with enhanced documentation
    _setup_enhanced_routes(app)
    
    return app

def _setup_enhanced_routes(app: FastAPI) -> None:
    """Set up all routes with enhanced documentation."""
    
    # Enhanced Pydantic models
    class AssistantRequest(BaseModel):
        message: str = Field(
            ..., 
            min_length=1,
            description="User message to process",
            example="Explain quantum computing in simple terms"
        )
        thread_id: Optional[str] = Field(
            None,
            description="Thread ID for persistent assistants",
            example="user123_thread_456"
        )
        config: Optional[Dict[str, Any]] = Field(
            None,
            description="Assistant configuration parameters",
            example={"temperature": 0.7, "max_tokens": 500}
        )
    
    # ... implement all enhanced endpoints
```

## 🛠️ Testing Enhanced Documentation

1. **Start the FastAPI server**:
   ```bash
   cd examples/langgraph-backend
   uv run serve
   ```

2. **Access interactive documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Test endpoints directly** in the Swagger UI using the demo credentials

4. **Export OpenAPI spec**:
   ```bash
   curl http://localhost:8000/openapi.json > openapi.json
   ```

## 📋 Benefits of FastAPI Auto-Documentation

- ✅ **Always in sync** with actual implementation
- ✅ **Interactive testing** built-in
- ✅ **Multiple formats** (Swagger UI, ReDoc, JSON)
- ✅ **Type validation** from Pydantic models
- ✅ **Example generation** from Field examples
- ✅ **No maintenance overhead** for separate spec files

This approach ensures your API documentation is always accurate and provides an excellent developer experience through FastAPI's automatic generation capabilities.