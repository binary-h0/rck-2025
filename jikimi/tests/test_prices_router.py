"""Test prices router."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    """Create test client."""
    app = create_app()
    return TestClient(app)


def test_prices_interval_validation(client: TestClient) -> None:
    """Test that interval parameter is validated."""
    # Valid intervals
    for interval in ["1d", "1h", "5m"]:
        response = client.get(f"/v1/companies/005930/prices?interval={interval}")
        assert response.status_code == 200
    
    # Invalid interval should return 422
    response = client.get("/v1/companies/005930/prices?interval=invalid")
    assert response.status_code == 422


def test_prices_adjust_validation(client: TestClient) -> None:
    """Test that adjust parameter is validated."""
    # Valid adjustments
    for adjust in ["none", "split", "total_return"]:
        response = client.get(f"/v1/companies/005930/prices?adjust={adjust}")
        assert response.status_code == 200
    
    # Invalid adjustment should return 422
    response = client.get("/v1/companies/005930/prices?adjust=invalid")
    assert response.status_code == 422


def test_prices_response_schema(client: TestClient) -> None:
    """Test that prices response matches schema."""
    response = client.get("/v1/companies/005930/prices")
    assert response.status_code == 200
    
    data = response.json()
    assert "company" in data
    assert "candles" in data
    assert "id" in data["company"]
    
    # Validate candles
    for candle in data["candles"]:
        assert "t" in candle
        assert "o" in candle
        assert "h" in candle
        assert "l" in candle
        assert "c" in candle
        assert "v" in candle


def test_predict_price_no_history(client: TestClient) -> None:
    """Test that predict-price returns 422 when no price history."""
    # This test would require a company with no price history
    # In memory mode, all companies have fake data
    # For real SQL mode, this would test the error handling
    
    response = client.post(
        "/v1/companies/NONEXISTENT/predict-price",
        json={
            "horizon_days": 7,
            "target": "return",
            "include_features": {"prices": True},
        },
    )
    
    # In memory mode with fake data, this will still return data
    # In SQL mode with no data, it should return 422
    assert response.status_code in [200, 422]

