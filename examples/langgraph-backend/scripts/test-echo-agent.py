#!/usr/bin/env python3
"""
Simple script to test the echo agent functionality without requiring real API keys.
This validates that the test-echo agent works independently for E2E testing.
"""

import os
import sys


# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


def test_echo_agent():
    """Test the echo agent functionality."""
    print("🧪 Testing Echo Agent Functionality")
    print("=" * 40)

    try:
        # Set minimal environment
        os.environ["OPENAI_API_KEY"] = "test-key"
        os.environ["ANTHROPIC_API_KEY"] = "test-key"
        os.environ["SECRET_KEY"] = "test-secret-key"

        # Import and test the echo agent directly
        from langchain_core.messages import HumanMessage

        from svelte_langgraph.graphs.test_echo_graph import create_test_echo_graph

        print("✅ Imports successful")

        # Create the echo agent
        echo_graph = create_test_echo_graph()
        print("✅ Echo agent graph created")

        # Test messages
        test_messages = [
            "Hello world",
            "Test message 123",
            "Special chars: !@#$%",
            "",  # Empty message test
        ]

        print("\n🔍 Testing echo responses:")
        print("-" * 30)

        all_tests_passed = True

        for i, message in enumerate(test_messages):
            try:
                # Prepare input
                input_data = {"messages": [HumanMessage(content=message)]}

                # Invoke the agent
                result = echo_graph.invoke(input_data)

                # Check the response
                response = result.get("response", "")
                expected = f"Echo: {message}"

                if response == expected:
                    print(f"  ✅ Test {i + 1}: '{message}' → '{response}'")
                else:
                    print(
                        f"  ❌ Test {i + 1}: '{message}' → '{response}' (expected: '{expected}')"
                    )
                    all_tests_passed = False

            except Exception as e:
                print(f"  ❌ Test {i + 1}: Exception - {e}")
                all_tests_passed = False

        # Test with assistant manager
        print("\n🔍 Testing through assistant manager:")
        print("-" * 40)

        try:
            from svelte_langgraph.assistant_manager import assistant_manager

            # Check if test-echo is available
            assistants = assistant_manager.list_assistants()
            if "test-echo" in assistants:
                print("✅ test-echo agent found in assistant manager")

                # Get the agent
                echo_agent = assistant_manager.get_assistant("test-echo")
                if echo_agent:
                    print("✅ test-echo agent retrieved successfully")

                    # Test health check
                    health = assistant_manager.health_check()
                    if (
                        "test-echo" in health
                        and health["test-echo"]["status"] == "healthy"
                    ):
                        print("✅ test-echo agent health check passed")
                    else:
                        print(
                            f"❌ test-echo agent health check failed: {health.get('test-echo', {})}"
                        )
                        all_tests_passed = False
                else:
                    print("❌ Failed to retrieve test-echo agent")
                    all_tests_passed = False
            else:
                print(
                    f"❌ test-echo agent not found. Available: {list(assistants.keys())}"
                )
                all_tests_passed = False

        except Exception as e:
            print(f"❌ Assistant manager test failed: {e}")
            all_tests_passed = False

        # Final result
        print("\n" + "=" * 40)
        if all_tests_passed:
            print("🎉 All echo agent tests PASSED!")
            print("✅ Ready for E2E testing without API keys")
            return True
        else:
            print("❌ Some echo agent tests FAILED!")
            print("🔧 Please check the implementation")
            return False

    except Exception as e:
        print(f"💥 Critical error: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_echo_agent()
    sys.exit(0 if success else 1)
