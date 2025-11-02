#!/bin/bash
# Quick start script to verify the application

set -e

echo "=== Equity Intelligence API - Quick Start ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp env.template .env
    echo "⚠️  Please edit .env and set your OPENAI_API_KEY before running predictions"
    echo ""
fi

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -q -e ".[dev]"
    echo "✓ Dependencies installed"
    echo ""
fi

echo "Project structure:"
echo "  app/                  - Main application code"
echo "    routers/            - API endpoints"
echo "    schemas/            - Pydantic models"
echo "    repositories/       - Data access layer"
echo "    services/           - Business logic"
echo "    utils/              - Shared utilities"
echo "  tests/                - Test suite"
echo ""

echo "Available commands:"
echo "  make install          - Install dependencies"
echo "  make run              - Start development server"
echo "  make test             - Run tests"
echo "  make lint             - Run linter"
echo "  make typecheck        - Run type checker"
echo "  make fmt              - Format code"
echo ""

echo "Quick test - running healthz check..."
echo "Starting server in background..."

# Start server in background
uvicorn app.main:app --host 127.0.0.1 --port 8765 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test healthz
echo "Testing /healthz endpoint..."
HEALTH=$(curl -s http://127.0.0.1:8765/healthz)

# Stop server
kill $SERVER_PID 2>/dev/null || true

if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✓ Health check passed!"
    echo ""
    echo "Ready to go! Run 'make run' to start the server."
else
    echo "✗ Health check failed"
    exit 1
fi

