"""Test prediction schema and OpenAI integration."""

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.market import CompanyRef, PriceCandle, PriceSeries
from app.services.prediction import predict_price
from app.utils.time import now_utc


@pytest.mark.asyncio
async def test_prediction_schema_conformance() -> None:
    """Test that OpenAI response conforms to expected schema."""
    # Mock OpenAI client
    mock_client = AsyncMock()
    
    # Create mock response
    base_time = now_utc()
    mock_response_data = {
        "series": [
            {
                "t": (base_time + timedelta(days=i)).isoformat().replace("+00:00", "Z"),
                "y": 75000.0 + i * 100,
                "uncertainty": {
                    "lower": 74000.0 + i * 100,
                    "upper": 76000.0 + i * 100,
                },
            }
            for i in range(7)
        ],
        "rationale": "Based on positive momentum and strong fundamentals...",
        "feature_importance": [
            {"name": "news_sentiment", "importance": 0.35},
            {"name": "price_momentum", "importance": 0.25},
        ],
    }
    
    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock()]
    mock_completion.choices[0].message.content = json.dumps(mock_response_data)
    mock_client.chat.completions.create.return_value = mock_completion
    
    # Create test data
    prices = PriceSeries(
        company=CompanyRef(id="005930", ticker="005930.KS"),
        candles=[
            PriceCandle(
                t=base_time - timedelta(days=i),
                o=75000.0,
                h=76000.0,
                l=74000.0,
                c=75000.0,
                v=10000000,
            )
            for i in range(30)
        ],
    )
    
    # Call prediction service
    prediction = await predict_price(
        company_id="005930",
        ticker="005930.KS",
        horizon_days=7,
        target="return",
        include_features={"prices": True, "news": False, "blind": False, "naver_forum": False, "filings": False},
        prices=prices,
        news=[],
        blind=[],
        naver_forum=[],
        filings=[],
        openai_client=mock_client,
    )
    
    # Validate schema conformance
    assert prediction.company.id == "005930"
    assert prediction.horizon_days == 7
    assert len(prediction.predicted_series) == 7
    
    # Validate prediction points
    for point in prediction.predicted_series:
        assert isinstance(point.t, datetime)
        assert isinstance(point.y, float)
        assert point.uncertainty is not None
        assert isinstance(point.uncertainty.lower, float)
        assert isinstance(point.uncertainty.upper, float)
    
    # Validate feature importance
    assert len(prediction.feature_importance) == 2
    for feat in prediction.feature_importance:
        assert isinstance(feat.name, str)
        assert 0.0 <= feat.importance <= 1.0
    
    # Validate rationale
    assert prediction.rationale_md is not None
    assert len(prediction.rationale_md) > 0


@pytest.mark.asyncio
async def test_prediction_no_price_history() -> None:
    """Test that prediction fails with no price history."""
    from app.errors import Unprocessable
    
    mock_client = AsyncMock()
    
    prices = PriceSeries(
        company=CompanyRef(id="005930", ticker="005930.KS"),
        candles=[],
    )
    
    with pytest.raises(Unprocessable, match="No price history available"):
        await predict_price(
            company_id="005930",
            ticker="005930.KS",
            horizon_days=7,
            target="return",
            include_features={},
            prices=prices,
            news=[],
            blind=[],
            naver_forum=[],
            filings=[],
            openai_client=mock_client,
        )

