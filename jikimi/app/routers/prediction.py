"""Price prediction endpoints."""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Path

from app.deps import DbSession
from app.errors import Unprocessable
from app.repositories.dart_repo import get_dart_repo
from app.repositories.news_repo import get_news_repo
from app.repositories.prices_repo import get_prices_repo
from app.repositories.social_repo import get_social_repo
from app.schemas.prediction import PredictRequest, PricePrediction
from app.services.prediction import predict_price
from app.utils.time import now_utc

router = APIRouter(prefix="/companies/{company_id}", tags=["prediction"])


@router.post("/predict-price", response_model=PricePrediction)
async def predict_stock_price(
    company_id: Annotated[str, Path(description="Company identifier")],
    request: PredictRequest,
    session: DbSession,
) -> PricePrediction:
    """Predict future stock price using AI.
    
    This endpoint fetches recent market data, news, social posts, and filings,
    then uses OpenAI to generate a price forecast with uncertainty bounds.
    
    Args:
        company_id: Company identifier
        request: Prediction request parameters
        session: Database session
        
    Returns:
        Price prediction with forecasted series and rationale
        
    Raises:
        Unprocessable: If insufficient data available
    """
    # Fetch historical data
    end_time = now_utc()
    start_time = end_time - timedelta(days=90)  # Last 90 days
    
    # Fetch prices
    prices_repo = await get_prices_repo(session)
    prices = await prices_repo.fetch_prices(
        company_id=company_id,
        start=start_time,
        end=end_time,
        interval="1d",
        adjust="split",
    )
    print(f"Prices: {prices}")
    
    if not prices.candles:
        raise Unprocessable("No price history available for this company")
    
    # Fetch news (last 30 days)
    news_start = end_time - timedelta(days=30)
    news = []
    if request.include_features.get("news", False):
        news_repo = await get_news_repo(session)
        news, _ = await news_repo.fetch_news(
            company_id=company_id,
            start=news_start,
            end=end_time,
            limit=100,
            cursor=None,
        )
    
    # Fetch 블라인드 posts
    blind = []
    if request.include_features.get("blind", False):
        social_repo = await get_social_repo(session)
        blind, _ = await social_repo.fetch_social(
            company_id=company_id,
            platform="blind",
            start=news_start,
            end=end_time,
            limit=100,
            cursor=None,
        )
    
    # Fetch 네이버 종토방 posts
    naver_forum = []
    if request.include_features.get("naver_forum", False):
        social_repo = await get_social_repo(session)
        naver_forum, _ = await social_repo.fetch_social(
            company_id=company_id,
            platform="naver_forum",
            start=news_start,
            end=end_time,
            limit=100,
            cursor=None,
        )
    
    # Fetch DART filings
    filings = []
    if request.include_features.get("filings", False):
        dart_repo = await get_dart_repo(session)
        filings, _ = await dart_repo.fetch_filings(
            company_id=company_id,
            start=news_start,
            end=end_time,
            limit=50,
            cursor=None,
        )
    
    # Generate prediction
    prediction = await predict_price(
        company_id=company_id,
        ticker=prices.company.ticker,
        horizon_days=request.horizon_days,
        target=request.target,
        include_features=request.include_features,
        prices=prices,
        news=news,
        blind=blind,
        naver_forum=naver_forum,
        filings=filings,
    )
    
    return prediction

