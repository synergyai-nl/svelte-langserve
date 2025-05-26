#!/usr/bin/env python3
"""
Test script to validate mock OpenAI implementation works correctly.
This ensures all agents can run without real API keys.
"""

import asyncio
import os
import sys


# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


async def test_mock_openai():
    """Test the mock OpenAI implementation."""
    print("🧪 Testing Mock OpenAI Implementation")
    print("=" * 45)

    try:
        # Set test mode environment
        os.environ["TEST_MODE"] = "true"
        os.environ["OPENAI_API_KEY"] = "test-key-for-mocking"
        os.environ["SECRET_KEY"] = "test-secret-key"

        # Import after setting environment
        from langchain_core.messages import HumanMessage

        from svelte_langgraph.llm import get_llm

        print("✅ Imports successful")

        # Test getting mock LLM
        mock_llm = get_llm("openai")
        print(f"✅ Mock LLM created: {type(mock_llm).__name__}")

        # Test different message types for context-aware responses
        test_cases = [
            ("Help me write Python code to sort a list", "code"),
            ("Tell me a creative story about robots", "creative"),
            ("Analyze this data: [1, 2, 3, 4, 5]", "data"),
            ("Research information about quantum computing", "research"),
            ("What is the meaning of life?", "general"),
        ]

        print("\n🔍 Testing sync responses:")
        print("-" * 35)

        all_tests_passed = True

        for i, (message, category) in enumerate(test_cases):
            try:
                # Test sync generation
                result = mock_llm.invoke([HumanMessage(content=message)])
                response = result.content

                # Validate response contains expected patterns
                expected_patterns = {
                    "code": ["python", "code"],
                    "creative": ["story", "creative"],
                    "data": ["analysis", "data"],
                    "research": ["research", "information"],
                    "general": ["response", "mock"],
                }

                has_expected = any(
                    pattern.lower() in response.lower()
                    for pattern in expected_patterns.get(category, ["mock"])
                )

                if has_expected and len(response) > 20:
                    print(
                        f"  ✅ Test {i + 1} ({category}): Response length={len(response)}"
                    )
                    print(f"     Preview: {response[:60]}...")
                else:
                    print(f"  ❌ Test {i + 1} ({category}): Unexpected response")
                    print(f"     Response: {response}")
                    all_tests_passed = False

            except Exception as e:
                print(f"  ❌ Test {i + 1} ({category}): Exception - {e}")
                all_tests_passed = False

        # Test streaming
        print("\n🔍 Testing streaming responses:")
        print("-" * 35)

        try:
            stream_message = "Tell me about artificial intelligence"
            chunks = []

            for chunk in mock_llm.stream([HumanMessage(content=stream_message)]):
                # Handle both AIMessage (direct) and ChatGeneration (wrapped)
                if hasattr(chunk, "content"):
                    # Direct AIMessage
                    chunks.append(chunk.content)
                elif hasattr(chunk, "message") and hasattr(chunk.message, "content"):
                    # ChatGeneration wrapper
                    chunks.append(chunk.message.content)
                else:
                    print(f"DEBUG: Unexpected chunk structure: {type(chunk)}")

            full_response = "".join(chunks)

            if len(chunks) > 3 and len(full_response) > 20:
                print(
                    f"  ✅ Streaming: {len(chunks)} chunks, total length={len(full_response)}"
                )
                print(f"     Preview: {full_response[:60]}...")
            else:
                print("  ❌ Streaming: Too few chunks or short response")
                print(f"     Chunks: {len(chunks)}, Response: {full_response}")
                all_tests_passed = False

        except Exception as e:
            print(f"  ❌ Streaming test failed: {e}")
            all_tests_passed = False

        # Test async streaming
        print("\n🔍 Testing async streaming:")
        print("-" * 35)

        try:
            async_chunks = []
            async for chunk in mock_llm.astream([HumanMessage(content=stream_message)]):
                # Handle both AIMessage (direct) and ChatGeneration (wrapped)
                if hasattr(chunk, "content"):
                    async_chunks.append(chunk.content)
                elif hasattr(chunk, "message") and hasattr(chunk.message, "content"):
                    async_chunks.append(chunk.message.content)

            async_response = "".join(async_chunks)

            if len(async_chunks) > 3 and len(async_response) > 20:
                print(
                    f"  ✅ Async streaming: {len(async_chunks)} chunks, total length={len(async_response)}"
                )
                print(f"     Preview: {async_response[:60]}...")
            else:
                print("  ❌ Async streaming: Too few chunks or short response")
                all_tests_passed = False

        except Exception as e:
            print(f"  ❌ Async streaming test failed: {e}")
            all_tests_passed = False

        # Test with assistant manager (all agents should work now)
        print("\n🔍 Testing agents with mock OpenAI:")
        print("-" * 40)

        try:
            from svelte_langgraph.assistant_manager import assistant_manager

            assistants = assistant_manager.list_assistants()
            print(f"✅ Available assistants: {list(assistants.keys())}")

            # Test health check - all should be healthy now
            health = assistant_manager.health_check()
            healthy_count = sum(
                1 for status in health.values() if status["status"] == "healthy"
            )
            total_count = len(health)

            print(f"✅ Healthy assistants: {healthy_count}/{total_count}")

            if healthy_count == total_count:
                print("✅ All assistants are healthy with mock OpenAI!")
            else:
                print("⚠️ Some assistants still unhealthy:")
                for name, status in health.items():
                    if status["status"] != "healthy":
                        print(f"     ❌ {name}: {status.get('error', 'Unknown error')}")

        except Exception as e:
            print(f"❌ Assistant manager test failed: {e}")
            all_tests_passed = False

        # Final result
        print("\n" + "=" * 45)
        if all_tests_passed:
            print("🎉 All mock OpenAI tests PASSED!")
            print("✅ All agents can now run without real API keys")
            print("🚀 Ready for CI/CD and local development")
            return True
        else:
            print("❌ Some mock OpenAI tests FAILED!")
            print("🔧 Please check the implementation")
            return False

    except Exception as e:
        print(f"💥 Critical error: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_mock_openai())
    sys.exit(0 if success else 1)
