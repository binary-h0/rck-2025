"""Price prediction schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.market import CompanyRef


class PredictRequest(BaseModel):
    """Request for price prediction."""
    
    horizon_days: int = Field(default=7, ge=1, le=90, description="Prediction horizon in days")
    target: Literal["close", "return"] = Field(default="return", description="Prediction target")
    include_features: dict[str, bool] = Field(
        default_factory=lambda: {
            "news": True,
            "blind": True,
            "naver_forum": True,
            "filings": True,
            "prices": True
        },
        description="Feature flags for prediction"
    )
    retrain: bool = Field(default=False, description="Force model retraining")

    model_config = {"json_schema_extra": {"example": {
        "horizon_days": 7,
        "target": "return",
        "include_features": {"news": True, "blind": True, "naver_forum": True, "filings": True, "prices": True},
        "retrain": False
    }}}


class UncertaintyBand(BaseModel):
    """Uncertainty bounds for prediction."""
    
    lower: float = Field(description="Lower bound")
    upper: float = Field(description="Upper bound")


class PredictionPoint(BaseModel):
    """Single prediction point."""
    
    t: datetime = Field(description="Timestamp (UTC)")
    y: float = Field(description="Predicted value (return or price depending on target)")
    uncertainty: UncertaintyBand | None = Field(default=None, description="Uncertainty bounds")
    
    # Calculated fields (populated when target='return')
    price: float | None = Field(default=None, description="Absolute price (calculated from return)")
    price_change: float | None = Field(default=None, description="Absolute price change in currency units")
    price_change_pct: float | None = Field(default=None, description="Price change as percentage")


class FeatureImportance(BaseModel):
    """Feature importance score."""
    
    name: str = Field(description="Feature name")
    importance: float = Field(ge=0.0, le=1.0, description="Importance score")


class PricePrediction(BaseModel):
    """Price prediction result."""
    
    company: CompanyRef = Field(description="Company reference")
    as_of: datetime = Field(description="Prediction generation time (UTC)")
    horizon_days: int = Field(description="Prediction horizon")
    method: str = Field(description="Prediction method/model")
    target: str = Field(description="Prediction target (return or close)")
    current_price: float | None = Field(default=None, description="Current/reference price")
    predicted_series: list[PredictionPoint] = Field(description="Predicted time series")
    feature_importance: list[FeatureImportance] = Field(
        default_factory=list,
        description="Feature importance scores"
    )
    rationale_md: str | None = Field(default=None, description="Markdown-formatted rationale")

    model_config = {"json_schema_extra": {"example": {
        "company": {"id": "005930", "ticker": "005930.KS"},
        "as_of": "2025-11-02T12:00:00Z",
        "horizon_days": 7,
        "method": "gpt-4o-mini",
        "predicted_series": [
            {"t": "2025-11-03T00:00:00Z", "y": 76500.0, "uncertainty": {"lower": 75000.0, "upper": 78000.0}},
            {"t": "2025-11-04T00:00:00Z", "y": 77000.0, "uncertainty": {"lower": 75500.0, "upper": 78500.0}}
        ],
        "feature_importance": [
            {"name": "news_sentiment", "importance": 0.35},
            {"name": "price_momentum", "importance": 0.25}
        ],
        "rationale_md": "Based on recent positive news and strong price momentum..."
    }}}

