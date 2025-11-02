"""Market data schemas (OHLCV prices)."""

from datetime import datetime

from pydantic import BaseModel, Field


class PriceCandle(BaseModel):
    """OHLCV price candle."""
    
    t: datetime = Field(description="Timestamp (UTC)")
    o: float = Field(description="Open price")
    h: float = Field(description="High price")
    l: float = Field(description="Low price")
    c: float = Field(description="Close price")
    v: int = Field(description="Volume")

    model_config = {"json_schema_extra": {"example": {
        "t": "2025-11-02T00:00:00Z",
        "o": 75000.0,
        "h": 76500.0,
        "l": 74800.0,
        "c": 76000.0,
        "v": 15000000
    }}}


class CompanyRef(BaseModel):
    """Minimal company reference."""
    
    id: str = Field(description="Company identifier")
    ticker: str | None = Field(default=None, description="Stock ticker")


class PriceSeries(BaseModel):
    """Historical price series for a company."""
    
    company: CompanyRef = Field(description="Company reference")
    candles: list[PriceCandle] = Field(description="Price candles")

    model_config = {"json_schema_extra": {"example": {
        "company": {"id": "005930", "ticker": "005930.KS"},
        "candles": [
            {"t": "2025-11-01T00:00:00Z", "o": 74500.0, "h": 75200.0, "l": 74000.0, "c": 75000.0, "v": 12000000},
            {"t": "2025-11-02T00:00:00Z", "o": 75000.0, "h": 76500.0, "l": 74800.0, "c": 76000.0, "v": 15000000}
        ]
    }}}

