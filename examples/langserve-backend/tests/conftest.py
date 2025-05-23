"""Test configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient

from src.claude_dashboard_backend.app import create_app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    app = create_app()
    return TestClient(app)


@pytest.fixture
def demo_user_credentials():
    """Demo user credentials for testing."""
    return {"username": "demo", "password": "secret"}


@pytest.fixture
def admin_user_credentials():
    """Admin user credentials for testing."""
    return {"username": "admin", "password": "secret"}


@pytest.fixture
def invalid_credentials():
    """Invalid credentials for testing."""
    return {"username": "invalid", "password": "wrong"}


@pytest.fixture
def demo_token(client, demo_user_credentials):
    """Get a valid JWT token for the demo user."""
    response = client.post("/token", data=demo_user_credentials)
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def admin_token(client, admin_user_credentials):
    """Get a valid JWT token for the admin user."""
    response = client.post("/token", data=admin_user_credentials)
    assert response.status_code == 200
    return response.json()["access_token"]