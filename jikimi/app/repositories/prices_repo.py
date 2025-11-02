"""Price data repository."""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CompanyModel, PriceCandleModel
from app.repositories.base import BaseRepository
from app.schemas.market import CompanyRef, PriceCandle, PriceSeries
from app.services.stock_data import get_stock_data_service
from app.utils.time import now_utc


class PricesRepository(BaseRepository):
    """Repository for price data."""
    
    async def fetch_prices(
        self,
        company_id: str,
        start: datetime | None = None,
        end: datetime | None = None,
        interval: str = "1d",
        adjust: str = "none",
    ) -> PriceSeries:
        """Fetch historical price data for a company.
        
        Args:
            company_id: Company identifier
            start: Start timestamp (inclusive)
            end: End timestamp (exclusive)
            interval: Candle interval ("1d", "1h", "5m")
            adjust: Price adjustment ("none", "split", "total_return")
            
        Returns:
            PriceSeries with company and candles
        """
        if self.is_memory_mode():
            return await self._fetch_prices_memory(company_id, start, end, interval, adjust)
        
        # Get company ticker from database
        company_query = select(CompanyModel.ticker).where(CompanyModel.id == company_id)
        ticker_result = await self.session.execute(company_query)
        ticker = ticker_result.scalar_one_or_none()
        
        # Fetch real-time data from Yahoo Finance
        from app.config import settings
        
        if settings.use_live_prices:
            # Always fetch live data when enabled (default)
            stock_service = get_stock_data_service()
            candles = await stock_service.fetch_historical_prices(
                company_id=company_id,
                ticker=ticker,
                start=start,
                end=end,
                interval=interval,
            )
            
            # Apply adjustments if requested
            if adjust == "split":
                candles = stock_service.apply_split_adjustment(candles)
            elif adjust == "total_return":
                candles = stock_service.apply_total_return_adjustment(candles)
            
            # Optional: Cache the fetched data to database for future requests
            if settings.cache_prices_to_db:
                # TODO: Implement caching logic to store fetched data
                pass
            
            return PriceSeries(
                company=CompanyRef(id=company_id, ticker=ticker),
                candles=candles,
            )
        
        # USE_LIVE_PRICES=false - fetch from database cache only
        query = select(PriceCandleModel).where(
            PriceCandleModel.company_id == company_id,
            PriceCandleModel.interval == interval,
            PriceCandleModel.adjust_type == adjust
        )
        
        # Apply time range filters
        if start:
            query = query.where(PriceCandleModel.timestamp >= start)
        if end:
            query = query.where(PriceCandleModel.timestamp < end)
        
        # Order by timestamp ascending
        query = query.order_by(PriceCandleModel.timestamp.asc())
        
        # Execute query
        result = await self.session.execute(query)
        rows = list(result.scalars().all())
        
        # Convert cached data to schema
        candles = [
            PriceCandle(
                t=row.timestamp,
                o=float(row.open),
                h=float(row.high),
                l=float(row.low),
                c=float(row.close),
                v=row.volume,
            )
            for row in rows
        ]
        
        return PriceSeries(
            company=CompanyRef(id=company_id, ticker=ticker),
            candles=candles,
        )
    
    async def _fetch_prices_memory(
        self,
        company_id: str,
        start: datetime | None,
        end: datetime | None,
        interval: str,
        adjust: str,
    ) -> PriceSeries:
        """In-memory implementation of fetch_prices."""
        base_time = now_utc().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Generate deterministic fake price data
        base_price = 75000.0
        
        # Determine number of candles based on interval
        if interval == "1d":
            delta = timedelta(days=1)
            num_candles = 30
        elif interval == "1h":
            delta = timedelta(hours=1)
            num_candles = 24 * 7  # 7 days
        elif interval == "5m":
            delta = timedelta(minutes=5)
            num_candles = 12 * 8  # 8 hours
        else:
            delta = timedelta(days=1)
            num_candles = 30
        
        candles = []
        for i in range(num_candles):
            t = base_time - (delta * (num_candles - i - 1))
            
            # Simple price variation
            price_variation = (i % 10 - 5) * 500
            open_price = base_price + price_variation
            close_price = base_price + price_variation + ((i % 3 - 1) * 200)
            high_price = max(open_price, close_price) + 300
            low_price = min(open_price, close_price) - 300
            volume = 10000000 + (i % 5) * 2000000
            
            candles.append(
                PriceCandle(
                    t=t,
                    o=open_price,
                    h=high_price,
                    l=low_price,
                    c=close_price,
                    v=volume,
                )
            )
        
        # Filter by time range
        if start:
            candles = [c for c in candles if c.t >= start]
        if end:
            candles = [c for c in candles if c.t < end]
        
        # Apply adjustments (simplified)
        if adjust == "split":
            # Apply split adjustment (example: 2:1 split)
            for candle in candles:
                if candle.t < base_time - timedelta(days=180):
                    candle.o /= 2
                    candle.h /= 2
                    candle.l /= 2
                    candle.c /= 2
                    candle.v *= 2
        elif adjust == "total_return":
            # Apply total return adjustment (dividends reinvested)
            dividend_factor = 1.02  # 2% dividend adjustment
            for candle in candles:
                candle.o *= dividend_factor
                candle.h *= dividend_factor
                candle.l *= dividend_factor
                candle.c *= dividend_factor
        
        return PriceSeries(
            company=CompanyRef(id=company_id, ticker=f"{company_id}.KS"),
            candles=candles,
        )


async def get_prices_repo(session: AsyncSession) -> PricesRepository:
    """Factory function for PricesRepository.
    
    Args:
        session: SQLAlchemy async session
        
    Returns:
        PricesRepository instance
    """
    return PricesRepository(session)

