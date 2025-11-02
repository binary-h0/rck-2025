"""Market data endpoints."""

from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query

from app.deps import DbSession
from app.repositories.prices_repo import PricesRepository, get_prices_repo
from app.schemas.market import PriceSeries
from app.utils.time import parse_ts

router = APIRouter(prefix="/companies/{company_id}", tags=["market"])


@router.get("/prices", response_model=PriceSeries)
async def get_prices(
    company_id: Annotated[str, Path(description="Company identifier")],
    session: DbSession,
    start: Annotated[str | None, Query(description="Start time (RFC3339)")] = None,
    end: Annotated[str | None, Query(description="End time (RFC3339)")] = None,
    interval: Annotated[Literal["1d", "1h", "5m"], Query(description="Candle interval")] = "1d",
    adjust: Annotated[
        Literal["none", "split", "total_return"],
        Query(description="Price adjustment type"),
    ] = "none",
) -> PriceSeries:
    """Get historical price data for a company.
    
    Args:
        company_id: Company identifier
        session: Database session
        start: Start timestamp (inclusive)
        end: End timestamp (exclusive)
        interval: Candle interval (1d, 1h, 5m)
        adjust: Price adjustment (none, split, total_return)
        
    Returns:
        Price series with OHLCV candles
    """
    start_dt: datetime | None = parse_ts(start) if start else None
    end_dt: datetime | None = parse_ts(end) if end else None
    
    repo = await get_prices_repo(session)
    prices = await repo.fetch_prices(
        company_id=company_id,
        start=start_dt,
        end=end_dt,
        interval=interval,
        adjust=adjust,
    )
    
    return prices

