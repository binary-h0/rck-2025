"""Common schemas shared across the API."""

from typing import Literal

from pydantic import BaseModel, Field


class Sentiment(BaseModel):
    """Sentiment analysis result with stock-impact score."""
    
    label: Literal["positive", "neutral", "negative"]
    score: float = Field(ge=-1.0, le=1.0, description="Sentiment score from -1 to 1")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence level from 0 to 1")
    rationale: str | None = Field(default=None, description="Optional explanation for the sentiment")

    model_config = {"json_schema_extra": {"example": {
        "label": "positive",
        "score": 0.75,
        "confidence": 0.85,
        "rationale": "Strong positive indicators in company fundamentals"
    }}}

