"""Stock market data service for fetching real-time and historical prices."""

import asyncio
from datetime import datetime, timedelta
from functools import lru_cache

import yfinance as yf

from app.schemas.market import PriceCandle
from app.utils.time import now_utc


class StockDataService:
    """Service for fetching real stock market data."""
    
    @staticmethod
    def _get_ticker_symbol(company_id: str, ticker: str | None) -> str:
        """Convert company ID or ticker to Yahoo Finance format.
        
        Args:
            company_id: Company ID (e.g., "005930")
            ticker: Optional ticker (e.g., "005930.KS")
            
        Returns:
            Yahoo Finance ticker symbol
        """
        if ticker:
            return ticker
        
        # Default to KOSPI exchange for Korean stocks
        return f"{company_id}.KS"
    
    @staticmethod
    def _yf_interval_map(interval: str) -> str:
        """Map API interval to yfinance interval.
        
        Args:
            interval: API interval (1d, 1h, 5m, 1m)
            
        Returns:
            yfinance interval string
        """
        mapping = {
            "1d": "1d",
            "1h": "1h",
            "5m": "5m",
            "1m": "1m",
        }
        return mapping.get(interval, "1d")
    
    @staticmethod
    async def fetch_historical_prices(
        company_id: str,
        ticker: str | None,
        start: datetime | None,
        end: datetime | None,
        interval: str,
    ) -> list[PriceCandle]:
        """Fetch historical price data from Yahoo Finance.
        
        Args:
            company_id: Company identifier
            ticker: Stock ticker symbol
            start: Start date (inclusive)
            end: End date (exclusive)
            interval: Data interval (1d, 1h, 5m, 1m)
            
        Returns:
            List of price candles
            
        Note:
            This method runs synchronous yfinance calls in a thread pool
            to avoid blocking the event loop.
        """
        # Default time range if not specified
        if end is None:
            end = now_utc()
        
        if start is None:
            # Default lookback based on interval
            lookback_days = {
                "1d": 365,  # 1 year
                "1h": 60,   # 60 days (max for hourly)
                "5m": 7,    # 7 days (max for 5min)
                "1m": 5,    # 5 days (max for 1min)
            }
            start = end - timedelta(days=lookback_days.get(interval, 365))
        
        # Get ticker symbol
        yf_ticker = StockDataService._get_ticker_symbol(company_id, ticker)
        yf_interval = StockDataService._yf_interval_map(interval)
        
        # Run yfinance in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(
            None,
            lambda: StockDataService._fetch_sync(yf_ticker, start, end, yf_interval)
        )
        
        # Convert DataFrame to PriceCandle list
        candles = []
        for idx, row in df.iterrows():
            # Handle timezone-aware and naive timestamps
            timestamp = idx.to_pydatetime()
            if timestamp.tzinfo is None:
                from datetime import timezone
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            
            candles.append(
                PriceCandle(
                    t=timestamp,
                    o=float(row["Open"]),
                    h=float(row["High"]),
                    l=float(row["Low"]),
                    c=float(row["Close"]),
                    v=int(row["Volume"]),
                )
            )
        
        return candles
    
    @staticmethod
    def _fetch_sync(ticker: str, start: datetime, end: datetime, interval: str):
        """Synchronous fetch from yfinance (runs in thread pool).
        
        Args:
            ticker: Yahoo Finance ticker
            start: Start datetime
            end: End datetime
            interval: yfinance interval
            
        Returns:
            pandas DataFrame with OHLCV data
        """
        stock = yf.Ticker(ticker)
        df = stock.history(
            start=start,
            end=end,
            interval=interval,
            auto_adjust=False,  # We'll handle adjustments ourselves
        )
        return df
    
    @staticmethod
    def apply_split_adjustment(candles: list[PriceCandle], split_factor: float = 2.0) -> list[PriceCandle]:
        """Apply stock split adjustment to historical prices.
        
        Args:
            candles: List of price candles
            split_factor: Split ratio (e.g., 2.0 for 2:1 split)
            
        Returns:
            Adjusted candles
            
        Note:
            This is a simplified implementation. In production, you'd fetch
            actual split events from the data source.
        """
        # For now, just return as-is
        # TODO: Implement actual split adjustment based on corporate actions
        return candles
    
    @staticmethod
    def apply_total_return_adjustment(candles: list[PriceCandle], dividend_yield: float = 0.02) -> list[PriceCandle]:
        """Apply total return adjustment (dividends reinvested).
        
        Args:
            candles: List of price candles
            dividend_yield: Annual dividend yield
            
        Returns:
            Adjusted candles
            
        Note:
            This is a simplified implementation. In production, you'd fetch
            actual dividend events and calculate precise adjustments.
        """
        # For now, just return as-is
        # TODO: Implement actual dividend adjustment based on payment dates
        return candles


# Global service instance
stock_data_service = StockDataService()


@lru_cache(maxsize=128)
def get_stock_data_service() -> StockDataService:
    """Get stock data service instance (cached).
    
    Returns:
        StockDataService instance
    """
    return stock_data_service

