.PHONY: install run fmt lint typecheck test clean

install:
	pip install -e ".[dev]"

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

fmt:
	ruff format .
	ruff check --fix .

lint:
	ruff check .

typecheck:
	mypy app/ tests/

test:
	pytest -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

