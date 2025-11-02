"""Holdings schemas (ESPP/우리사주)."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.market import CompanyRef


class EsppLot(BaseModel):
    """Individual ESPP purchase lot."""
    
    lot_id: str = Field(description="Lot identifier")
    purchase_date: datetime = Field(description="Purchase date (UTC)")
    quantity: int = Field(ge=0, description="Number of shares")
    purchase_price: float = Field(ge=0.0, description="Price per share at purchase")
    cost_basis: float = Field(ge=0.0, description="Total cost basis")

    model_config = {"json_schema_extra": {"example": {
        "lot_id": "lot_2024_q1",
        "purchase_date": "2024-03-15T00:00:00Z",
        "quantity": 100,
        "purchase_price": 70000.0,
        "cost_basis": 7000000.0
    }}}


class EsppHoldings(BaseModel):
    """ESPP holdings for a user."""
    
    user_id: str = Field(description="User identifier")
    company: CompanyRef = Field(description="Company reference")
    total_quantity: int = Field(ge=0, description="Total shares held")
    total_cost_basis: float = Field(ge=0.0, description="Total cost basis")
    lots: list[EsppLot] = Field(description="Individual purchase lots")
    last_updated: datetime = Field(description="Last update timestamp (UTC)")

    model_config = {"json_schema_extra": {"example": {
        "user_id": "user_123",
        "company": {"id": "005930", "ticker": "005930.KS"},
        "total_quantity": 250,
        "total_cost_basis": 17500000.0,
        "lots": [
            {"lot_id": "lot_2024_q1", "purchase_date": "2024-03-15T00:00:00Z", "quantity": 100, "purchase_price": 70000.0, "cost_basis": 7000000.0},
            {"lot_id": "lot_2024_q2", "purchase_date": "2024-06-15T00:00:00Z", "quantity": 150, "purchase_price": 70000.0, "cost_basis": 10500000.0}
        ],
        "last_updated": "2025-11-02T12:00:00Z"
    }}}

