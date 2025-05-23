"""Tests for authentication functionality."""

import pytest
from jose import jwt

from src.claude_dashboard_backend.auth import (
    SECRET_KEY,
    ALGORITHM,
    authenticate_user,
    create_access_token,
    fake_users_db,
    get_password_hash,
    verify_password,
)


class TestPasswordHashing:
    """Test password hashing functions."""

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "secret"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed)

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "secret"
        wrong_password = "wrong"
        hashed = get_password_hash(password)
        assert not verify_password(wrong_password, hashed)

    def test_password_hash_different_each_time(self):
        """Test that password hashes are different each time."""
        password = "secret"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        assert hash1 != hash2


class TestUserAuthentication:
    """Test user authentication functions."""

    def test_authenticate_user_valid(self):
        """Test user authentication with valid credentials."""
        user = authenticate_user(fake_users_db, "demo", "secret")
        assert user is not None
        assert user.username == "demo"
        assert user.email == "demo@example.com"

    def test_authenticate_user_invalid_username(self):
        """Test user authentication with invalid username."""
        user = authenticate_user(fake_users_db, "nonexistent", "secret")
        assert user is None

    def test_authenticate_user_invalid_password(self):
        """Test user authentication with invalid password."""
        user = authenticate_user(fake_users_db, "demo", "wrong")
        assert user is None


class TestJWTTokens:
    """Test JWT token creation and validation."""

    def test_create_access_token(self):
        """Test JWT token creation."""
        data = {"sub": "demo"}
        token = create_access_token(data)
        
        # Decode and verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "demo"
        assert "exp" in payload

    def test_create_access_token_with_expiration(self):
        """Test JWT token creation with custom expiration."""
        from datetime import timedelta
        
        data = {"sub": "demo"}
        expires_delta = timedelta(minutes=5)
        token = create_access_token(data, expires_delta)
        
        # Decode and verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "demo"
        assert "exp" in payload


class TestAuthenticationEndpoints:
    """Test authentication API endpoints."""

    def test_login_valid_credentials(self, client, demo_user_credentials):
        """Test login with valid credentials."""
        response = client.post("/token", data=demo_user_credentials)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client, invalid_credentials):
        """Test login with invalid credentials."""
        response = client.post("/token", data=invalid_credentials)
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["detail"]

    def test_login_missing_credentials(self, client):
        """Test login with missing credentials."""
        response = client.post("/token", data={})
        
        assert response.status_code == 422  # Validation error

    def test_get_current_user_valid_token(self, client, demo_token):
        """Test getting current user with valid token."""
        headers = {"Authorization": f"Bearer {demo_token}"}
        response = client.get("/users/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "demo"
        assert data["email"] == "demo@example.com"
        assert data["full_name"] == "Demo User"
        assert data["disabled"] is False

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/users/me", headers=headers)
        
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    def test_get_current_user_no_token(self, client):
        """Test getting current user without token."""
        response = client.get("/users/me")
        
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    def test_get_current_user_malformed_header(self, client):
        """Test getting current user with malformed authorization header."""
        headers = {"Authorization": "InvalidFormat token"}
        response = client.get("/users/me", headers=headers)
        
        assert response.status_code == 401

    def test_admin_user_login(self, client, admin_user_credentials):
        """Test admin user login."""
        response = client.post("/token", data=admin_user_credentials)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        
        # Test getting admin user info
        headers = {"Authorization": f"Bearer {data['access_token']}"}
        user_response = client.get("/users/me", headers=headers)
        
        assert user_response.status_code == 200
        user_data = user_response.json()
        assert user_data["username"] == "admin"
        assert user_data["full_name"] == "Admin User"


class TestProtectedEndpoints:
    """Test that endpoints are properly protected."""

    def test_health_endpoint_public(self, client):
        """Test that health endpoint is public."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["auth_required"] is True

    def test_root_endpoint_public(self, client):
        """Test that root endpoint is public."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_langserve_endpoints_protected(self, client):
        """Test that LangServe endpoints are protected."""
        protected_paths = [
            "/chatbot/docs",
            "/code-assistant/docs", 
            "/data-analyst/docs",
            "/creative-writer/docs",
            "/research-assistant/docs"
        ]
        
        for path in protected_paths:
            response = client.get(path)
            # Should be 401 (unauthorized) or 403 (forbidden)
            assert response.status_code in [401, 403, 404]  # 404 if path doesn't exist

    def test_langserve_endpoints_with_auth(self, client, demo_token):
        """Test accessing LangServe endpoints with valid authentication."""
        headers = {"Authorization": f"Bearer {demo_token}"}
        
        # Test docs endpoints that should be accessible
        protected_paths = [
            "/chatbot/docs",
            "/code-assistant/docs",
            "/data-analyst/docs", 
            "/creative-writer/docs",
            "/research-assistant/docs"
        ]
        
        for path in protected_paths:
            response = client.get(path, headers=headers)
            # Should either be 200 (success) or 404 (not found, but not 401/403)
            assert response.status_code not in [401, 403]