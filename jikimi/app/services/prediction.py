"""Stock price prediction service using OpenAI."""

import json
from datetime import datetime, timedelta
from typing import Any

from openai import AsyncOpenAI

from app.config import settings
from app.errors import SchemaViolation, Unprocessable
from app.schemas.intelligence import Article, Filing, SocialPost
from app.schemas.market import PriceCandle, PriceSeries
from app.schemas.prediction import FeatureImportance, PredictionPoint, PricePrediction
from app.utils.time import now_utc, to_rfc3339


def _assemble_features(
    prices: PriceSeries,
    news: list[Article],
    blind: list[SocialPost],
    naver_forum: list[SocialPost],
    filings: list[Filing],
    include: dict[str, bool],
) -> dict[str, Any]:
    """Assemble feature dictionary for prediction model.
    
    This includes minimal but realistic features:
    - Rolling returns buckets from price history
    - Event counts by sentiment polarity with recency decay
    - Social momentum indicators
    
    Args:
        prices: Historical price series
        news: News articles
        blind: 블라인드 posts
        naver_forum: 네이버 종토방 posts
        filings: DART filings
        include: Feature inclusion flags
        
    Returns:
        Feature dictionary
    """
    features: dict[str, Any] = {}
    
    # Price-based features
    if include.get("prices", False) and prices.candles:
        candles = prices.candles[-30:]  # Last 30 periods
        
        if len(candles) >= 2:
            # Calculate returns
            returns = []
            for i in range(1, len(candles)):
                ret = (candles[i].c - candles[i - 1].c) / candles[i - 1].c
                returns.append(ret)
            
            # Return buckets
            features["returns_mean"] = sum(returns) / len(returns) if returns else 0.0
            features["returns_volatility"] = (
                sum((r - features["returns_mean"]) ** 2 for r in returns) / len(returns)
            ) ** 0.5 if returns else 0.0
            
            # Momentum
            if len(candles) >= 10:
                recent_return = (candles[-1].c - candles[-10].c) / candles[-10].c
                features["momentum_10d"] = recent_return
        
        # Volume trend
        recent_volume = sum(c.v for c in candles[-5:]) / 5 if len(candles) >= 5 else 0
        older_volume = sum(c.v for c in candles[-10:-5]) / 5 if len(candles) >= 10 else recent_volume
        features["volume_trend"] = (recent_volume - older_volume) / older_volume if older_volume > 0 else 0.0
    
    # News sentiment features
    if include.get("news", False):
        positive_count = sum(1 for a in news if a.sentiment and a.sentiment.label == "positive")
        negative_count = sum(1 for a in news if a.sentiment and a.sentiment.label == "negative")
        neutral_count = sum(1 for a in news if a.sentiment and a.sentiment.label == "neutral")
        
        features["news_positive_count"] = positive_count
        features["news_negative_count"] = negative_count
        features["news_neutral_count"] = neutral_count
        features["news_total_count"] = len(news)
        
        # Weighted sentiment score with recency decay
        now = now_utc()
        weighted_sentiment = 0.0
        total_weight = 0.0
        for article in news:
            if article.sentiment:
                hours_old = (now - article.published_at).total_seconds() / 3600
                weight = max(0.1, 1.0 - (hours_old / (24 * 30)))  # Decay over 30 days
                weighted_sentiment += article.sentiment.score * weight
                total_weight += weight
        
        features["news_weighted_sentiment"] = weighted_sentiment / total_weight if total_weight > 0 else 0.0
    
    # 블라인드 features
    if include.get("blind", False):
        features["blind_post_count"] = len(blind)
        features["blind_engagement"] = sum(p.reply_count + p.like_count for p in blind)
        
        positive_blind = sum(1 for p in blind if p.sentiment and p.sentiment.label == "positive")
        features["blind_positive_ratio"] = positive_blind / len(blind) if blind else 0.0
    
    # 네이버 종토방 features
    if include.get("naver_forum", False):
        features["naver_forum_post_count"] = len(naver_forum)
        features["naver_forum_engagement"] = sum(p.reply_count + p.like_count for p in naver_forum)
    
    # DART filings features
    if include.get("filings", False):
        features["filings_count"] = len(filings)
        
        # Recent filing indicator
        if filings:
            most_recent = max(f.filed_at for f in filings)
            days_since_filing = (now_utc() - most_recent).days
            features["days_since_last_filing"] = days_since_filing
    
    return features


def _to_prediction(
    company_id: str,
    ticker: str | None,
    horizon_days: int,
    target: str,
    current_price: float,
    series: list[dict[str, Any]],
    rationale: str,
    feature_importance: list[dict[str, Any]] | None = None,
) -> PricePrediction:
    """Convert OpenAI response to PricePrediction schema.
    
    Args:
        company_id: Company identifier
        ticker: Stock ticker
        horizon_days: Prediction horizon
        target: Prediction target
        current_price: Current/reference price
        series: Predicted time series data
        rationale: Prediction rationale
        feature_importance: Optional feature importance scores
        
    Returns:
        PricePrediction schema
    """
    from app.schemas.market import CompanyRef
    
    # Parse prediction points
    prediction_points = []
    for point in series:
        uncertainty = None
        if "uncertainty" in point:
            from app.schemas.prediction import UncertaintyBand
            unc_data = point["uncertainty"]
            uncertainty = UncertaintyBand(lower=unc_data["lower"], upper=unc_data["upper"])
        
        y_value = float(point["y"])
        
        # Calculate absolute prices if target is 'return'
        price = None
        price_change = None
        price_change_pct = None
        
        if target == "return":
            # y is a decimal return, convert to absolute price
            price = current_price * (1 + y_value)
            price_change = price - current_price
            price_change_pct = y_value * 100  # Convert to percentage
        elif target == "close":
            # y is already an absolute price
            price = y_value
            price_change = y_value - current_price
            price_change_pct = (price_change / current_price) * 100 if current_price > 0 else 0.0
        
        prediction_points.append(
            PredictionPoint(
                t=datetime.fromisoformat(point["t"].replace("Z", "+00:00")),
                y=y_value,
                uncertainty=uncertainty,
                price=price,
                price_change=price_change,
                price_change_pct=price_change_pct,
            )
        )
    
    # Parse feature importance
    importance_list = []
    if feature_importance:
        for feat in feature_importance:
            importance_list.append(
                FeatureImportance(name=feat["name"], importance=float(feat["importance"]))
            )
    
    return PricePrediction(
        company=CompanyRef(id=company_id, ticker=ticker),
        as_of=now_utc(),
        horizon_days=horizon_days,
        method=settings.openai_model,
        target=target,
        current_price=current_price,
        predicted_series=prediction_points,
        feature_importance=importance_list,
        rationale_md=rationale,
    )


async def predict_price(
    company_id: str,
    ticker: str | None,
    horizon_days: int,
    target: str,
    include_features: dict[str, bool],
    prices: PriceSeries,
    news: list[Article],
    blind: list[SocialPost],
    naver_forum: list[SocialPost],
    filings: list[Filing],
    openai_client: AsyncOpenAI | None = None,
) -> PricePrediction:
    """Generate price prediction using OpenAI with structured output.
    
    Args:
        company_id: Company identifier
        ticker: Stock ticker
        horizon_days: Number of days to predict
        target: Prediction target ("close" or "return")
        include_features: Feature inclusion flags
        prices: Historical price data
        news: News articles
        blind: 블라인드 posts
        naver_forum: 네이버 종토방 posts
        filings: DART filings
        openai_client: Optional OpenAI client (for testing)
        
    Returns:
        PricePrediction with forecasted series and rationale
        
    Raises:
        Unprocessable: If no price history available
        SchemaViolation: If OpenAI response doesn't match schema
    """
    if not prices.candles:
        raise Unprocessable("No price history available for prediction")
    
    # Assemble features
    features = _assemble_features(prices, news, blind, naver_forum, filings, include_features)
    
    # Get current price
    current_price = prices.candles[-1].c if prices.candles else 0.0
    
    # Build prompt
    prompt = f"""You are a financial analyst predicting stock prices.

Company: {company_id} ({ticker or 'N/A'})
Current Price: {current_price:.2f}
Horizon: {horizon_days} days
Target: {target}

Features:
{json.dumps(features, indent=2)}

Recent Price History (last 10 candles):
"""
    
    for candle in prices.candles[-10:]:
        prompt += f"- {to_rfc3339(candle.t)}: Close={candle.c:.2f}, Volume={candle.v}\n"
    
    prompt += f"""

Based on the features and price history, predict the {"closing price" if target == "close" else "daily return"} for the next {horizon_days} days.

Provide predictions with uncertainty bounds and a detailed rationale explaining:
1. Key factors influencing the prediction
2. Major risks and assumptions
3. Market context and sentiment analysis
"""
    
    # Define JSON schema for structured output
    # OpenAI's structured output requires:
    # 1. "additionalProperties": false for all objects
    # 2. All properties must be in "required" array (no optional fields)
    response_schema = {
        "type": "object",
        "properties": {
            "series": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "t": {"type": "string"},
                        "y": {"type": "number"},
                        "uncertainty": {
                            "type": "object",
                            "properties": {
                                "lower": {"type": "number"},
                                "upper": {"type": "number"},
                            },
                            "required": ["lower", "upper"],
                            "additionalProperties": False,
                        },
                    },
                    "required": ["t", "y", "uncertainty"],  # All properties must be required
                    "additionalProperties": False,
                },
            },
            "rationale": {"type": "string"},
            "feature_importance": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "importance": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                    "required": ["name", "importance"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["series", "rationale", "feature_importance"],  # All properties required
        "additionalProperties": False,
    }
    
    # Create OpenAI client if not provided
    if openai_client is None:
        openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    try:
        # Call OpenAI with structured output
        response = await openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a financial analyst providing structured price predictions."},
                {"role": "user", "content": prompt},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "price_prediction",
                    "strict": True,
                    "schema": response_schema,
                },
            },
        )
        
        # Parse response
        content = response.choices[0].message.content
        if not content:
            raise SchemaViolation("Empty response from OpenAI")
        
        result = json.loads(content)
        
        # Convert to PricePrediction
        return _to_prediction(
            company_id=company_id,
            ticker=ticker,
            horizon_days=horizon_days,
            target=target,
            current_price=current_price,
            series=result["series"],
            rationale=result["rationale"],
            feature_importance=result.get("feature_importance"),
        )
        
    except json.JSONDecodeError as e:
        raise SchemaViolation(f"Failed to parse OpenAI response: {e}") from e
    except KeyError as e:
        raise SchemaViolation(f"Missing required field in OpenAI response: {e}") from e
    except Exception as e:
        raise SchemaViolation(f"Error generating prediction: {e}") from e

