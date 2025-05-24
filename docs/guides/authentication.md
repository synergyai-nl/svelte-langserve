# Authentication & Security Guide

Complete guide for implementing secure authentication, authorization, and security best practices in Svelte LangServe applications.

## 🔐 Authentication Overview

Svelte LangServe uses JWT-based authentication with the following flow:

```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant AI Service

    Client->>Frontend: Login credentials
    Frontend->>Backend: POST /token
    Backend-->>Frontend: JWT token + user info
    Frontend->>Backend: WebSocket + JWT
    Backend-->>Frontend: Authenticated connection
    Frontend->>AI Service: Protected API calls
```

## 🚀 Quick Authentication Setup

### 1. Environment Configuration

```bash
# .env
SECRET_KEY=your-super-secure-secret-key-at-least-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256

# Optional: Database for persistent users
DATABASE_URL=postgresql://user:pass@localhost:5432/langserve
```

### 2. Backend Authentication Setup

The backend includes JWT authentication out of the box:

```python
# examples/langserve-backend/src/svelte_langserve/auth.py

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database/storage
    user = await get_user_by_username(username)
    if user is None:
        raise credentials_exception
    
    return user
```

### 3. Frontend Authentication Integration

```typescript
// examples/dashboard/src/lib/auth.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
  id: string;
  username: string;
  email?: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Create auth store
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  return {
    subscribe,
    
    // Initialize auth state from localStorage
    init: () => {
      if (browser) {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } catch {
            // Clear invalid data
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
        
        update(state => ({ ...state, isLoading: false }));
      }
    },
    
    // Login
    login: async (username: string, password: string) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const response = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username, password })
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const data = await response.json();
        const user = await fetchUserInfo(data.access_token);
        
        // Store in localStorage
        if (browser) {
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('auth_user', JSON.stringify(user));
        }
        
        set({
          user,
          token: data.access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        return user;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage
        }));
        throw error;
      }
    },
    
    // Logout
    logout: () => {
      if (browser) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    },
    
    // Clear error
    clearError: () => {
      update(state => ({ ...state, error: null }));
    }
  };
}

export const authStore = createAuthStore();

// Helper function to fetch user info
async function fetchUserInfo(token: string): Promise<User> {
  const response = await fetch('/api/users/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  
  return response.json();
}
```

### 4. Protected Routes

```svelte
<!-- examples/dashboard/src/routes/+layout.svelte -->
<script>
  import { authStore } from '$lib/auth';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/chat', '/settings'];
  
  $: isProtectedRoute = protectedRoutes.some(route => 
    $page.url.pathname.startsWith(route)
  );
  
  $: if (!$authStore.isLoading && isProtectedRoute && !$authStore.isAuthenticated) {
    goto('/login');
  }
  
  onMount(() => {
    authStore.init();
  });
</script>

{#if $authStore.isLoading}
  <div class="loading">Loading...</div>
{:else}
  <slot />
{/if}
```

## 🔑 User Registration & Management

### Registration Component

```svelte
<!-- src/lib/components/Register.svelte -->
<script>
  import { Button, Card, Label, Input, Alert } from 'flowbite-svelte';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  let errors = {};
  let isLoading = false;
  
  function validateForm() {
    errors = {};
    
    if (!formData.username || formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      errors.email = 'Valid email is required';
    }
    
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    isLoading = true;
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }
      
      dispatch('registered', {
        username: formData.username,
        email: formData.email
      });
      
    } catch (error) {
      errors.general = error.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<Card class="max-w-md mx-auto">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
    Create Account
  </h2>
  
  {#if errors.general}
    <Alert color="red" class="mb-4">{errors.general}</Alert>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <Label for="username">Username</Label>
      <Input 
        id="username" 
        bind:value={formData.username}
        class={errors.username ? 'border-red-500' : ''}
        required 
      />
      {#if errors.username}
        <p class="text-red-500 text-sm mt-1">{errors.username}</p>
      {/if}
    </div>
    
    <div>
      <Label for="email">Email</Label>
      <Input 
        id="email" 
        type="email" 
        bind:value={formData.email}
        class={errors.email ? 'border-red-500' : ''}
        required 
      />
      {#if errors.email}
        <p class="text-red-500 text-sm mt-1">{errors.email}</p>
      {/if}
    </div>
    
    <div>
      <Label for="password">Password</Label>
      <Input 
        id="password" 
        type="password" 
        bind:value={formData.password}
        class={errors.password ? 'border-red-500' : ''}
        required 
      />
      {#if errors.password}
        <p class="text-red-500 text-sm mt-1">{errors.password}</p>
      {/if}
    </div>
    
    <div>
      <Label for="confirmPassword">Confirm Password</Label>
      <Input 
        id="confirmPassword" 
        type="password" 
        bind:value={formData.confirmPassword}
        class={errors.confirmPassword ? 'border-red-500' : ''}
        required 
      />
      {#if errors.confirmPassword}
        <p class="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
      {/if}
    </div>
    
    <Button type="submit" disabled={isLoading} class="w-full">
      {isLoading ? 'Creating Account...' : 'Create Account'}
    </Button>
  </form>
</Card>
```

### Login Component

```svelte
<!-- src/lib/components/Login.svelte -->
<script>
  import { Button, Card, Label, Input, Alert, Checkbox } from 'flowbite-svelte';
  import { authStore } from '$lib/auth';
  import { goto } from '$app/navigation';
  
  let username = '';
  let password = '';
  let rememberMe = false;
  let isLoading = false;
  
  $: error = $authStore.error;
  
  async function handleLogin() {
    if (!username || !password) return;
    
    isLoading = true;
    authStore.clearError();
    
    try {
      await authStore.login(username, password);
      goto('/dashboard');
    } catch (err) {
      // Error is handled by the store
    } finally {
      isLoading = false;
    }
  }
</script>

<Card class="max-w-md mx-auto">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
    Sign In
  </h2>
  
  {#if error}
    <Alert color="red" class="mb-4">{error}</Alert>
  {/if}
  
  <form on:submit|preventDefault={handleLogin} class="space-y-4">
    <div>
      <Label for="username">Username</Label>
      <Input 
        id="username" 
        bind:value={username}
        placeholder="Enter your username"
        required 
      />
    </div>
    
    <div>
      <Label for="password">Password</Label>
      <Input 
        id="password" 
        type="password" 
        bind:value={password}
        placeholder="Enter your password"
        required 
      />
    </div>
    
    <div class="flex items-center justify-between">
      <Checkbox bind:checked={rememberMe}>Remember me</Checkbox>
      <a href="/forgot-password" class="text-sm text-primary-600 hover:underline dark:text-primary-500">
        Forgot password?
      </a>
    </div>
    
    <Button type="submit" disabled={isLoading || !username || !password} class="w-full">
      {isLoading ? 'Signing In...' : 'Sign In'}
    </Button>
  </form>
  
  <div class="text-center mt-4">
    <span class="text-sm text-gray-500 dark:text-gray-400">
      Don't have an account?
      <a href="/register" class="text-primary-600 hover:underline dark:text-primary-500">
        Sign up
      </a>
    </span>
  </div>
</Card>
```

## 🔒 WebSocket Authentication

### Socket.IO Authentication

```typescript
// examples/dashboard/src/hooks.server.ts - WebSocket auth middleware

import jwt from 'jsonwebtoken';

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    
    // Get user from database
    const user = await getUserById(decoded.sub);
    if (!user) {
      return next(new Error('User not found'));
    }
    
    // Attach user to socket
    socket.data.user = user;
    socket.data.userId = user.id;
    
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
});

// Handle authenticated connections
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`User ${user.username} connected`);
  
  // Join user-specific room
  socket.join(`user:${user.id}`);
  
  // Handle conversation access control
  socket.on('join_conversation', async (data) => {
    const { conversationId } = data;
    
    // Check if user has access to conversation
    const hasAccess = await checkConversationAccess(user.id, conversationId);
    if (!hasAccess) {
      socket.emit('error', {
        type: 'PERMISSION_DENIED',
        message: 'You do not have access to this conversation'
      });
      return;
    }
    
    socket.join(`conversation:${conversationId}`);
    socket.emit('conversation_joined', { conversationId });
  });
});
```

### Frontend Socket Authentication

```typescript
// examples/dashboard/src/lib/stores/langserve.ts

import { authStore } from '$lib/auth';
import { io } from 'socket.io-client';

function createLangServeStore() {
  // ... existing store code ...
  
  const connect = async (serverUrl: string, userId: string, authToken?: string) => {
    try {
      // Get token from auth store if not provided
      const token = authToken || get(authStore).token;
      
      if (!token) {
        throw new Error('Authentication token required');
      }
      
      const socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });
      
      // Handle authentication errors
      socket.on('connect_error', (error) => {
        if (error.message.includes('Authentication')) {
          // Token expired or invalid - redirect to login
          authStore.logout();
          goto('/login');
        }
        
        update(state => ({
          ...state,
          connectionError: error.message,
          connected: false
        }));
      });
      
      socket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          // Server disconnected us - might be auth issue
          console.log('Server disconnected, checking auth...');
        }
      });
      
      // Store socket and update state
      update(state => ({ ...state, socket, connected: true }));
      
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  };
  
  return { subscribe, connect, /* other methods */ };
}
```

## 👥 Role-Based Access Control

### Permission System

```python
# Backend permission system
from enum import Enum
from typing import List

class Permission(str, Enum):
    READ_CONVERSATIONS = "read:conversations"
    WRITE_CONVERSATIONS = "write:conversations"
    DELETE_CONVERSATIONS = "delete:conversations"
    ADMIN_USERS = "admin:users"
    ADMIN_SYSTEM = "admin:system"

class Role(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

ROLE_PERMISSIONS = {
    Role.USER: [
        Permission.READ_CONVERSATIONS,
        Permission.WRITE_CONVERSATIONS
    ],
    Role.MODERATOR: [
        Permission.READ_CONVERSATIONS,
        Permission.WRITE_CONVERSATIONS,
        Permission.DELETE_CONVERSATIONS
    ],
    Role.ADMIN: [
        Permission.READ_CONVERSATIONS,
        Permission.WRITE_CONVERSATIONS,
        Permission.DELETE_CONVERSATIONS,
        Permission.ADMIN_USERS,
        Permission.ADMIN_SYSTEM
    ]
}

def check_permission(user_role: str, required_permission: Permission) -> bool:
    """Check if user role has required permission."""
    return required_permission in ROLE_PERMISSIONS.get(Role(user_role), [])

# Permission decorator
def require_permission(permission: Permission):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user') or args[0]  # Adjust based on your setup
            
            if not check_permission(current_user.role, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission {permission} required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Usage in endpoints
@app.delete("/api/conversations/{conversation_id}")
@require_permission(Permission.DELETE_CONVERSATIONS)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    # Delete conversation logic
    pass
```

### Frontend Permission Checks

```typescript
// Frontend permission utilities
import type { User } from '$lib/types';

export enum Permission {
  READ_CONVERSATIONS = 'read:conversations',
  WRITE_CONVERSATIONS = 'write:conversations',
  DELETE_CONVERSATIONS = 'delete:conversations',
  ADMIN_USERS = 'admin:users',
  ADMIN_SYSTEM = 'admin:system'
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user || !user.permissions) return false;
  return permissions.some(p => user.permissions.includes(p));
}

export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user || !user.permissions) return false;
  return permissions.every(p => user.permissions.includes(p));
}
```

```svelte
<!-- Permission-based UI components -->
<script>
  import { authStore } from '$lib/auth';
  import { hasPermission, Permission } from '$lib/permissions';
  
  $: user = $authStore.user;
  $: canDelete = hasPermission(user, Permission.DELETE_CONVERSATIONS);
  $: canAdmin = hasPermission(user, Permission.ADMIN_USERS);
</script>

<!-- Conditional rendering based on permissions -->
{#if canDelete}
  <Button color="red" on:click={deleteConversation}>
    Delete Conversation
  </Button>
{/if}

{#if canAdmin}
  <a href="/admin" class="admin-link">
    Admin Panel
  </a>
{/if}
```

## 🛡️ Security Best Practices

### 1. JWT Security

```python
# Secure JWT configuration
import secrets

# Generate secure secret key
SECRET_KEY = secrets.token_urlsafe(32)  # Use environment variable in production

# JWT settings
JWT_SETTINGS = {
    "secret_key": SECRET_KEY,
    "algorithm": "HS256",
    "access_token_expire_minutes": 30,  # Short expiration
    "refresh_token_expire_days": 7,     # Refresh token for longer sessions
    "issuer": "svelte-langserve",
    "audience": "langserve-users"
}

def create_tokens(user_data: dict):
    """Create both access and refresh tokens."""
    access_token_expires = timedelta(minutes=JWT_SETTINGS["access_token_expire_minutes"])
    refresh_token_expires = timedelta(days=JWT_SETTINGS["refresh_token_expire_days"])
    
    access_token = create_access_token(
        data={"sub": user_data["username"], "type": "access"},
        expires_delta=access_token_expires
    )
    
    refresh_token = create_access_token(
        data={"sub": user_data["username"], "type": "refresh"},
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": JWT_SETTINGS["access_token_expire_minutes"] * 60
    }
```

### 2. Password Security

```python
# Strong password requirements
import re
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Higher rounds for better security
)

def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """Validate password meets security requirements."""
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("Password must contain at least one special character")
    
    # Check against common passwords
    common_passwords = ["password", "123456", "password123", "admin"]
    if password.lower() in common_passwords:
        errors.append("Password is too common")
    
    return len(errors) == 0, errors
```

### 3. Rate Limiting

```python
# Advanced rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis

# Redis-based rate limiting for distributed systems
redis_client = redis.Redis(host='localhost', port=6379, db=0)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Different limits for different endpoints
@app.post("/token")
@limiter.limit("5/minute")  # Strict limit for login
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    # Login logic
    pass

@app.post("/api/send-message")
@limiter.limit("60/minute")  # More generous for chat
async def send_message(request: Request, ...):
    # Message handling
    pass

# User-specific rate limiting
def get_user_id(request: Request):
    # Extract user ID from JWT token
    pass

@app.post("/api/premium-feature")
@limiter.limit("100/hour", key_func=get_user_id)  # Per-user limiting
async def premium_feature(request: Request, ...):
    # Premium feature logic
    pass
```

### 4. CORS Configuration

```python
# Secure CORS configuration
from fastapi.middleware.cors import CORSMiddleware

# Production CORS settings
ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://app.yourdomain.com"
]

# Development CORS (more permissive)
if os.getenv("ENVIRONMENT") == "development":
    ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Total-Count"]
)
```

### 5. Input Validation & Sanitization

```python
# Input validation with Pydantic
from pydantic import BaseModel, validator, Field
from typing import Optional
import bleach

class MessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    conversation_id: str = Field(..., regex=r"^[a-zA-Z0-9_-]+$")
    endpoints: list[str] = Field(..., min_items=1, max_items=5)
    metadata: Optional[dict] = None
    
    @validator('content')
    def sanitize_content(cls, v):
        # Remove potentially dangerous HTML/JS
        return bleach.clean(v, strip=True)
    
    @validator('endpoints')
    def validate_endpoints(cls, v):
        # Ensure endpoints are valid
        valid_endpoints = ["chatbot", "code-assistant", "data-analyst", "creative-writer", "research-assistant"]
        for endpoint in v:
            if endpoint not in valid_endpoints:
                raise ValueError(f"Invalid endpoint: {endpoint}")
        return v
```

## 🔍 Security Monitoring

### Audit Logging

```python
# Security audit logging
import structlog
from datetime import datetime

security_logger = structlog.get_logger("security")

def log_security_event(event_type: str, user_id: str, details: dict = None):
    """Log security-related events for monitoring."""
    security_logger.info(
        "Security event",
        event_type=event_type,
        user_id=user_id,
        timestamp=datetime.utcnow().isoformat(),
        details=details or {},
        ip_address=get_client_ip(),
        user_agent=get_user_agent()
    )

# Usage in endpoints
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = authenticate_user(form_data.username, form_data.password)
        if not user:
            log_security_event("login_failed", form_data.username, {
                "reason": "invalid_credentials"
            })
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        log_security_event("login_success", user.id)
        return create_tokens({"username": user.username})
        
    except Exception as e:
        log_security_event("login_error", form_data.username, {
            "error": str(e)
        })
        raise
```

### Intrusion Detection

```python
# Simple intrusion detection
from collections import defaultdict
import asyncio

# Track failed login attempts
failed_attempts = defaultdict(list)
LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION = 300  # 5 minutes

async def check_lockout(ip_address: str) -> bool:
    """Check if IP is locked out due to failed attempts."""
    now = datetime.utcnow()
    
    # Clean old attempts
    failed_attempts[ip_address] = [
        attempt for attempt in failed_attempts[ip_address]
        if (now - attempt).seconds < LOCKOUT_DURATION
    ]
    
    return len(failed_attempts[ip_address]) >= LOCKOUT_THRESHOLD

async def record_failed_attempt(ip_address: str):
    """Record a failed login attempt."""
    failed_attempts[ip_address].append(datetime.utcnow())
    
    # Alert on suspicious activity
    if len(failed_attempts[ip_address]) >= LOCKOUT_THRESHOLD:
        security_logger.warning(
            "IP lockout triggered",
            ip_address=ip_address,
            attempts=len(failed_attempts[ip_address])
        )
```

For more security considerations, see the [Production Deployment Guide](./deployment.md#security-configuration).

## 🧪 Testing Authentication

### Unit Tests

```python
# test_auth.py
import pytest
from fastapi.testclient import TestClient
from jose import jwt

def test_login_success(client: TestClient):
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient):
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "wrongpass"}
    )
    assert response.status_code == 401

def test_protected_endpoint_without_token(client: TestClient):
    response = client.get("/api/users/me")
    assert response.status_code == 401

def test_protected_endpoint_with_valid_token(client: TestClient, auth_token: str):
    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
```

### Integration Tests

```typescript
// Frontend auth tests
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { authStore } from '$lib/auth';
import Login from '$lib/components/Login.svelte';

describe('Authentication Flow', () => {
  test('successful login updates auth store', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        access_token: 'mock-token',
        token_type: 'bearer'
      })
    });
    
    render(Login);
    
    await fireEvent.input(screen.getByLabelText('Username'), {
      target: { value: 'testuser' }
    });
    
    await fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: 'testpass' }
    });
    
    await fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Wait for auth store to update
    await waitFor(() => {
      expect(get(authStore).isAuthenticated).toBe(true);
    });
  });
});
```

This authentication guide provides a complete, production-ready security implementation for Svelte LangServe applications with JWT authentication, role-based access control, and comprehensive security monitoring.