"""Company-related schemas."""

from pydantic import BaseModel, Field


class Company(BaseModel):
    """Company information."""
    
    id: str = Field(description="Unique company identifier")
    ticker: str | None = Field(default=None, description="Stock ticker symbol")
    name: str = Field(description="Company name")
    sector: str | None = Field(default=None, description="Industry sector")
    market: str | None = Field(default=None, description="Market exchange")

    model_config = {"json_schema_extra": {"example": {
        "id": "005930",
        "ticker": "005930.KS",
        "name": "삼성전자",
        "sector": "Technology",
        "market": "KOSPI"
    }}}


class PaginatedCompanies(BaseModel):
    """Paginated list of companies."""
    
    data: list[Company] = Field(description="List of companies")
    next_cursor: str | None = Field(default=None, description="Cursor for next page")

    model_config = {"json_schema_extra": {"example": {
        "data": [{"id": "005930", "ticker": "005930.KS", "name": "삼성전자", "sector": "Technology", "market": "KOSPI"}],
        "next_cursor": "eyJ0cyI6IjIwMjUtMTEtMDIiLCJpZCI6IjAwNTkzMCJ9"
    }}}

