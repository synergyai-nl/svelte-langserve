FROM python:3.11-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    gcc \
    musl-dev \
    libffi-dev

# Install uv for dependency management
RUN pip install uv

# Copy project files
COPY examples/langgraph-backend/pyproject.toml examples/langgraph-backend/uv.lock ./

# Install dependencies
RUN uv sync --frozen

# Copy application code
COPY examples/langgraph-backend/ .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uv", "run", "uvicorn", "src.svelte_langgraph.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]