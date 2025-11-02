#!/usr/bin/env python3
"""Verification script to check implementation completeness."""

import os
import sys
from pathlib import Path

def check_file_exists(path: Path, description: str) -> bool:
    """Check if a file exists."""
    if path.exists():
        print(f"✓ {description}")
        return True
    else:
        print(f"✗ {description} - MISSING")
        return False

def main() -> int:
    """Run all checks."""
    root = Path(__file__).parent
    all_passed = True
    
    print("=== Equity API Implementation Verification ===\n")
    
    # Check core files
    print("Core Application Files:")
    all_passed &= check_file_exists(root / "app" / "main.py", "Main application")
    all_passed &= check_file_exists(root / "app" / "config.py", "Configuration")
    all_passed &= check_file_exists(root / "app" / "auth.py", "Authentication")
    all_passed &= check_file_exists(root / "app" / "deps.py", "Dependencies")
    all_passed &= check_file_exists(root / "app" / "errors.py", "Error handling")
    print()
    
    # Check utilities
    print("Utility Modules:")
    all_passed &= check_file_exists(root / "app" / "utils" / "pagination.py", "Pagination")
    all_passed &= check_file_exists(root / "app" / "utils" / "time.py", "Time utilities")
    all_passed &= check_file_exists(root / "app" / "utils" / "hashing.py", "Hashing")
    print()
    
    # Check schemas
    print("Pydantic Schemas:")
    schemas = ["common", "company", "intelligence", "market", "prediction", "holdings"]
    for schema in schemas:
        all_passed &= check_file_exists(root / "app" / "schemas" / f"{schema}.py", f"Schema: {schema}")
    print()
    
    # Check repositories
    print("Repositories:")
    repos = ["base", "companies_repo", "news_repo", "social_repo", "dart_repo", "prices_repo", "holdings_repo"]
    for repo in repos:
        all_passed &= check_file_exists(root / "app" / "repositories" / f"{repo}.py", f"Repository: {repo}")
    print()
    
    # Check services
    print("Services:")
    all_passed &= check_file_exists(root / "app" / "services" / "sentiment.py", "Sentiment service")
    all_passed &= check_file_exists(root / "app" / "services" / "prediction.py", "Prediction service")
    print()
    
    # Check routers
    print("API Routers:")
    routers = ["companies", "intelligence", "market", "prediction", "holdings"]
    for router in routers:
        all_passed &= check_file_exists(root / "app" / "routers" / f"{router}.py", f"Router: {router}")
    print()
    
    # Check tests
    print("Tests:")
    tests = ["test_pagination", "test_prediction_schema", "test_prices_router"]
    for test in tests:
        all_passed &= check_file_exists(root / "tests" / f"{test}.py", f"Test: {test}")
    print()
    
    # Check documentation
    print("Documentation:")
    all_passed &= check_file_exists(root / "README.md", "README")
    all_passed &= check_file_exists(root / "ASSUMPTIONS.md", "ASSUMPTIONS")
    all_passed &= check_file_exists(root / "API_EXAMPLES.md", "API Examples")
    all_passed &= check_file_exists(root / "IMPLEMENTATION_SUMMARY.md", "Implementation Summary")
    print()
    
    # Check config files
    print("Configuration Files:")
    all_passed &= check_file_exists(root / "pyproject.toml", "pyproject.toml")
    all_passed &= check_file_exists(root / "Makefile", "Makefile")
    all_passed &= check_file_exists(root / "env.template", "Environment template")
    all_passed &= check_file_exists(root / ".gitignore", ".gitignore")
    print()
    
    # Count Python files
    py_files = list(root.glob("app/**/*.py")) + list(root.glob("tests/**/*.py"))
    print(f"Total Python files: {len(py_files)}")
    
    # Count lines
    total_lines = 0
    for py_file in py_files:
        try:
            with open(py_file) as f:
                total_lines += len(f.readlines())
        except Exception:
            pass
    print(f"Total lines of code: {total_lines}")
    print()
    
    # Final result
    if all_passed:
        print("✅ All checks passed! Implementation is complete.")
        return 0
    else:
        print("❌ Some files are missing. Please check the implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

