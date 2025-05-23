#!/bin/bash

# Local CI test script
# This script runs the same checks that CI would run to catch issues early

set -e

echo "🧪 Running local CI checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "pnpm-workspace.yaml" ]; then
    echo -e "${RED}❌ Please run this script from the project root${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install --frozen-lockfile
print_status $? "Dependencies installed"

echo -e "${YELLOW}🔍 Frontend checks...${NC}"
cd examples/dashboard

# Frontend type checking
echo "  🔍 Type checking..."
pnpm check
print_status $? "Frontend type checking"

# Frontend linting
echo "  🧹 Linting..."
pnpm lint
print_status $? "Frontend linting"

# Frontend formatting
echo "  💅 Format checking..."
pnpm exec prettier --check .
print_status $? "Frontend formatting"

# Frontend unit tests
echo "  🧪 Unit tests..."
pnpm test:unit --run
print_status $? "Frontend unit tests"

# Frontend build
echo "  🏗️ Building..."
pnpm build
print_status $? "Frontend build"

cd ../..

echo -e "${YELLOW}🐍 Backend checks...${NC}"
cd examples/langserve-backend

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo -e "${RED}❌ uv is not installed. Please install it: curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
    exit 1
fi

# Backend dependencies
echo "  📦 Installing Python dependencies..."
uv sync --dev
print_status $? "Backend dependencies"

# Backend linting
echo "  🧹 Linting..."
uv run ruff check .
print_status $? "Backend linting"

# Backend formatting
echo "  💅 Format checking..."
uv run ruff format --check .
print_status $? "Backend formatting"

# Backend type checking
echo "  🔍 Type checking..."
uv run mypy src/
print_status $? "Backend type checking"

# Backend tests
echo "  🧪 Tests..."
uv run pytest
print_status $? "Backend tests"

cd ../..

echo -e "${GREEN}🎉 All local CI checks passed!${NC}"
echo -e "${YELLOW}💡 Your changes are ready for CI. Consider running E2E tests manually if you made significant changes.${NC}"