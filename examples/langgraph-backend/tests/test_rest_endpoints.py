"""Tests for REST API endpoints - comprehensive coverage of manual testing."""

# Constants for assistant endpoint paths to reduce duplication
ASSISTANT_DOCS_PATHS = [
    "/chatbot/docs",
    "/code-assistant/docs",
    "/data-analyst/docs",
    "/creative-writer/docs",
    "/research-assistant/docs",
]

ASSISTANT_PLAYGROUND_PATHS = [
    "/chatbot/playground",
    "/code-assistant/playground",
    "/data-analyst/playground",
    "/creative-writer/playground",
    "/research-assistant/playground",
]


class TestHealthEndpoint:
    """Test health check endpoint functionality."""

    def test_health_endpoint_structure(self, client):
        """Test health endpoint returns proper structure."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        # Test required fields from our documentation
        assert "status" in data
        assert "version" in data
        assert "auth_required" in data
        assert "assistants" in data
        assert "assistant_health" in data
        assert "backend_type" in data

        # Test field values and types
        assert data["status"] in ["healthy", "degraded"]
        assert data["version"] == "1.0"
        assert data["auth_required"] is True
        assert data["backend_type"] == "langgraph"
        assert isinstance(data["assistants"], list)
        assert isinstance(data["assistant_health"], dict)

    def test_health_endpoint_assistants_list(self, client):
        """Test that health endpoint returns correct assistants list."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assistants = data["assistants"]
        expected_assistants = [
            "chatbot",
            "chatbot-persistent",
            "code-assistant",
            "data-analyst",
            "creative-writer",
            "research-assistant",
        ]

        # All expected assistants should be present
        for assistant in expected_assistants:
            assert assistant in assistants

    def test_health_endpoint_no_auth_required(self, client):
        """Test that health endpoint doesn't require authentication."""
        # Should work without any authorization header
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_endpoint_with_auth(self, client, demo_token):
        """Test that health endpoint works with authentication too."""
        headers = {"Authorization": f"Bearer {demo_token}"}
        response = client.get("/health", headers=headers)
        assert response.status_code == 200


class TestRootEndpoint:
    """Test root API endpoint functionality."""

    def test_root_endpoint_structure(self, client):
        """Test root endpoint returns proper structure."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        # Test required fields
        assert "message" in data
        assert "documentation" in data
        assert "health" in data
        assert "available_assistants" in data

    def test_root_endpoint_assistant_details(self, client):
        """Test that root endpoint provides detailed assistant information."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        assistants = data["available_assistants"]

        # Test that each assistant has proper structure
        for assistant_key, assistant_info in assistants.items():
            assert "name" in assistant_info
            assert "description" in assistant_info
            assert "endpoint" in assistant_info

            # Test that endpoint URLs are properly formatted
            assert assistant_info["endpoint"].startswith("/")

    def test_root_endpoint_documentation_links(self, client):
        """Test that root endpoint provides proper documentation links."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        # Check that documentation field exists and points to /docs
        assert "documentation" in data
        assert data["documentation"] == "/docs"

        # Check that health endpoint is listed
        assert "health" in data
        assert data["health"] == "/health"

        # Check that backend type is specified
        assert "backend_type" in data
        assert data["backend_type"] == "langgraph"

    def test_root_endpoint_no_auth_required(self, client):
        """Test that root endpoint doesn't require authentication."""
        response = client.get("/")
        assert response.status_code == 200


class TestAssistantEndpoints:
    """Test assistant-related endpoints."""

    def test_assistant_endpoints_require_auth(self, client):
        """Test that assistant endpoints require authentication."""
        for path in ASSISTANT_DOCS_PATHS:
            response = client.get(path)
            # Should be unauthorized (401) or forbidden (403), not 200
            assert response.status_code in [
                401,
                403,
                404,
            ]  # 404 if LangServe path doesn't exist

    def test_assistant_endpoints_with_valid_auth(self, client, demo_token):
        """Test assistant endpoints with valid authentication."""
        headers = {"Authorization": f"Bearer {demo_token}"}

        for path in ASSISTANT_DOCS_PATHS:
            response = client.get(path, headers=headers)
            # Should not be authentication error if auth is valid
            assert response.status_code not in [401, 403]

    def test_assistant_playground_endpoints_with_auth(self, client, demo_token):
        """Test assistant playground endpoints with authentication."""
        headers = {"Authorization": f"Bearer {demo_token}"}

        for path in ASSISTANT_PLAYGROUND_PATHS:
            response = client.get(path, headers=headers)
            # Should not be authentication error if auth is valid
            assert response.status_code not in [401, 403]


class TestAuthenticationFlow:
    """Test complete authentication flow scenarios."""

    def test_complete_auth_flow_demo_user(self, client, demo_user_credentials):
        """Test complete authentication flow for demo user."""
        # Step 1: Login
        login_response = client.post("/token", data=demo_user_credentials)
        assert login_response.status_code == 200

        token_data = login_response.json()
        assert "access_token" in token_data
        assert "token_type" in token_data
        assert token_data["token_type"] == "bearer"

        # Step 2: Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        user_response = client.get("/users/me", headers=headers)
        assert user_response.status_code == 200

        user_data = user_response.json()
        assert user_data["username"] == "demo"
        assert user_data["email"] == "demo@example.com"
        assert user_data["disabled"] is False

    def test_complete_auth_flow_admin_user(self, client, admin_user_credentials):
        """Test complete authentication flow for admin user."""
        # Step 1: Login
        login_response = client.post("/token", data=admin_user_credentials)
        assert login_response.status_code == 200

        token_data = login_response.json()
        assert "access_token" in token_data
        assert "token_type" in token_data
        assert token_data["token_type"] == "bearer"

        # Step 2: Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        user_response = client.get("/users/me", headers=headers)
        assert user_response.status_code == 200

        user_data = user_response.json()
        assert user_data["username"] == "admin"
        assert user_data["full_name"] == "Admin User"

    def test_token_validation_edge_cases(self, client):
        """Test token validation edge cases."""
        # Test various malformed authorization headers
        malformed_headers = [
            {"Authorization": "invalid_format"},
            {"Authorization": "Bearer"},  # Missing token
            {"Authorization": "Basic dGVzdA=="},  # Wrong auth type
            {"Authorization": "Bearer " + "x" * 1000},  # Very long invalid token
        ]

        for headers in malformed_headers:
            response = client.get("/users/me", headers=headers)
            assert response.status_code == 401

    def test_expired_token_handling(self, client):
        """Test handling of expired tokens."""
        # Use a clearly invalid/expired token
        expired_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vIiwiZXhwIjoxfQ.invalid"
        headers = {"Authorization": f"Bearer {expired_token}"}

        response = client.get("/users/me", headers=headers)
        assert response.status_code == 401


class TestCORSAndHeaders:
    """Test CORS and HTTP headers handling."""

    def test_options_request_handling(self, client):
        """Test OPTIONS request handling for CORS preflight."""
        response = client.options("/health")
        # OPTIONS should be handled gracefully
        assert response.status_code in [
            200,
            405,
        ]  # 405 if OPTIONS not explicitly handled

    def test_content_type_handling(self, client, demo_user_credentials):
        """Test content type handling for different endpoints."""
        # Test form data for token endpoint (required)
        response = client.post("/token", data=demo_user_credentials)
        assert response.status_code == 200

        # Test JSON for token endpoint (should fail validation)
        response = client.post("/token", json=demo_user_credentials)
        assert response.status_code == 422

    def test_response_headers(self, client):
        """Test that responses have proper headers."""
        response = client.get("/health")
        assert response.status_code == 200

        # Check content type
        assert "application/json" in response.headers.get("content-type", "")


class TestErrorHandling:
    """Test error handling scenarios."""

    def test_404_error_handling(self, client):
        """Test 404 error for non-existent endpoints."""
        response = client.get("/nonexistent/endpoint")
        assert response.status_code == 404

    def test_405_method_not_allowed(self, client):
        """Test 405 error for unsupported HTTP methods."""
        # Try unsupported methods on known endpoints
        response = client.patch("/health")
        assert response.status_code == 405

        response = client.delete("/")
        assert response.status_code == 405

    def test_422_validation_errors(self, client):
        """Test 422 validation errors."""
        # Missing required fields
        response = client.post("/token", data={})
        assert response.status_code == 422

        error_data = response.json()
        assert "detail" in error_data
        assert isinstance(error_data["detail"], list)

    def test_large_request_handling(self, client):
        """Test handling of unusually large requests."""
        # Test with very long username/password
        large_credentials = {"username": "x" * 1000, "password": "y" * 1000}

        response = client.post("/token", data=large_credentials)
        # Should handle gracefully (either 401 for invalid creds or 422 for validation)
        assert response.status_code in [401, 422]


class TestPerformanceAndLimits:
    """Test performance and rate limiting aspects."""

    def test_concurrent_health_checks(self, client):
        """Test that multiple concurrent health checks work."""
        import threading

        results = []

        def make_request():
            response = client.get("/health")
            results.append(response.status_code)

        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join(timeout=10)

        # All requests should succeed
        assert len(results) == 5
        assert all(status == 200 for status in results)

    def test_multiple_auth_requests(self, client, demo_user_credentials):
        """Test multiple authentication requests."""
        # Multiple login attempts should work
        for _ in range(3):
            response = client.post("/token", data=demo_user_credentials)
            assert response.status_code == 200

            token_data = response.json()
            assert "access_token" in token_data
