"""Unit tests for authentication functions (no FastAPI dependencies)."""

import pytest
from datetime import timedelta
from jose import jwt

from src.svelte_langserve.auth import (
    SECRET_KEY,
    ALGORITHM,
    authenticate_user,
    create_access_token,
    fake_users_db,
    get_password_hash,
    get_user,
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

    def test_password_hash_not_plaintext(self):
        """Test that password hash is not the plaintext password."""
        password = "secret"
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > len(password)


class TestUserDatabase:
    """Test user database functions."""

    def test_get_user_exists(self):
        """Test getting an existing user."""
        user = get_user(fake_users_db, "demo")
        assert user is not None
        assert user.username == "demo"
        assert user.email == "demo@example.com"
        assert user.full_name == "Demo User"
        assert user.disabled is False

    def test_get_user_not_exists(self):
        """Test getting a non-existent user."""
        user = get_user(fake_users_db, "nonexistent")
        assert user is None

    def test_demo_user_exists(self):
        """Test that demo user exists with correct data."""
        assert "demo" in fake_users_db
        demo_data = fake_users_db["demo"]
        assert demo_data["username"] == "demo"
        assert demo_data["email"] == "demo@example.com"
        assert demo_data["full_name"] == "Demo User"
        assert demo_data["disabled"] is False
        assert "hashed_password" in demo_data

    def test_admin_user_exists(self):
        """Test that admin user exists with correct data."""
        assert "admin" in fake_users_db
        admin_data = fake_users_db["admin"]
        assert admin_data["username"] == "admin"
        assert admin_data["email"] == "admin@example.com"
        assert admin_data["full_name"] == "Admin User"
        assert admin_data["disabled"] is False
        assert "hashed_password" in admin_data


class TestUserAuthentication:
    """Test user authentication functions."""

    def test_authenticate_user_valid_demo(self):
        """Test user authentication with valid demo credentials."""
        user = authenticate_user(fake_users_db, "demo", "secret")
        assert user is not None
        assert user.username == "demo"
        assert user.email == "demo@example.com"

    def test_authenticate_user_valid_admin(self):
        """Test user authentication with valid admin credentials."""
        user = authenticate_user(fake_users_db, "admin", "secret")
        assert user is not None
        assert user.username == "admin"
        assert user.email == "admin@example.com"

    def test_authenticate_user_invalid_username(self):
        """Test user authentication with invalid username."""
        user = authenticate_user(fake_users_db, "nonexistent", "secret")
        assert user is None

    def test_authenticate_user_invalid_password(self):
        """Test user authentication with invalid password."""
        user = authenticate_user(fake_users_db, "demo", "wrong")
        assert user is None

    def test_authenticate_user_empty_credentials(self):
        """Test user authentication with empty credentials."""
        user = authenticate_user(fake_users_db, "", "")
        assert user is None

    def test_authenticate_user_none_credentials(self):
        """Test user authentication with None credentials."""
        user = authenticate_user(fake_users_db, None, None)
        assert user is None


class TestJWTTokens:
    """Test JWT token creation and validation."""

    def test_create_access_token_basic(self):
        """Test JWT token creation with basic data."""
        data = {"sub": "demo"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens are typically long strings

        # Decode and verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "demo"
        assert "exp" in payload

    def test_create_access_token_with_custom_expiration(self):
        """Test JWT token creation with custom expiration."""
        data = {"sub": "demo"}
        expires_delta = timedelta(minutes=5)
        token = create_access_token(data, expires_delta)

        # Decode and verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "demo"
        assert "exp" in payload

    def test_create_access_token_different_users(self):
        """Test JWT token creation for different users."""
        demo_token = create_access_token({"sub": "demo"})
        admin_token = create_access_token({"sub": "admin"})

        assert demo_token != admin_token

        demo_payload = jwt.decode(demo_token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])

        assert demo_payload["sub"] == "demo"
        assert admin_payload["sub"] == "admin"

    def test_jwt_token_structure(self):
        """Test JWT token has correct structure."""
        data = {"sub": "demo"}
        token = create_access_token(data)

        # JWT tokens have 3 parts separated by dots
        parts = token.split(".")
        assert len(parts) == 3

        # Each part should be base64 encoded (non-empty)
        for part in parts:
            assert len(part) > 0

    def test_jwt_decode_with_wrong_secret(self):
        """Test that JWT token cannot be decoded with wrong secret."""
        data = {"sub": "demo"}
        token = create_access_token(data)

        with pytest.raises(jwt.JWTError):
            jwt.decode(token, "wrong-secret", algorithms=[ALGORITHM])

    def test_jwt_decode_with_wrong_algorithm(self):
        """Test that JWT token cannot be decoded with wrong algorithm."""
        data = {"sub": "demo"}
        token = create_access_token(data)

        with pytest.raises(jwt.JWTError):
            jwt.decode(token, SECRET_KEY, algorithms=["HS512"])


class TestAuthConstants:
    """Test authentication constants and configuration."""

    def test_secret_key_exists(self):
        """Test that SECRET_KEY is defined."""
        assert SECRET_KEY is not None
        assert len(SECRET_KEY) > 0

    def test_algorithm_is_hs256(self):
        """Test that algorithm is HS256."""
        assert ALGORITHM == "HS256"

    def test_fake_users_db_structure(self):
        """Test that fake users database has correct structure."""
        assert isinstance(fake_users_db, dict)
        assert len(fake_users_db) >= 2  # At least demo and admin users

        for username, user_data in fake_users_db.items():
            assert isinstance(user_data, dict)
            assert "username" in user_data
            assert "email" in user_data
            assert "full_name" in user_data
            assert "disabled" in user_data
            assert "hashed_password" in user_data
            assert user_data["username"] == username
