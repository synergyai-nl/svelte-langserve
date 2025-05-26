"""Test configuration and fixtures."""

import os
from unittest.mock import MagicMock, patch

import pytest

from fastapi.testclient import TestClient

# Set testing environment before importing app
os.environ["TESTING"] = "true"

from src.svelte_langgraph.app import create_app


@pytest.fixture
def mock_llm():
    """Mock LLM for testing."""
    mock = MagicMock()
    mock.invoke.return_value = "Mocked LLM response"
    return mock


@pytest.fixture
def client(mock_llm):
    """Create a test client for the FastAPI app with mocked dependencies."""
    with patch("src.svelte_langgraph.llm.get_llm", return_value=mock_llm):
        with patch(
            "src.svelte_langgraph.chains.chatbot.get_llm", return_value=mock_llm
        ):
            with patch(
                "src.svelte_langgraph.chains.code_assistant.get_llm",
                return_value=mock_llm,
            ):
                with patch(
                    "src.svelte_langgraph.chains.creative_writer.get_llm",
                    return_value=mock_llm,
                ):
                    with patch(
                        "src.svelte_langgraph.chains.data_analyst.get_llm",
                        return_value=mock_llm,
                    ):
                        with patch(
                            "src.svelte_langgraph.chains.research_assistant.get_llm",
                            return_value=mock_llm,
                        ):
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
