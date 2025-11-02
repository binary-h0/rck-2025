"""Sentiment analysis utilities using OpenAI."""

import json
from typing import Literal

from openai import AsyncOpenAI

from app.config import Settings
from app.errors import SchemaViolation, AIProviderError
from app.schemas.common import Sentiment


def normalize_sentiment(raw: dict[str, float | str]) -> Sentiment:
    """Normalize and validate sentiment data.
    
    주가영향도 sentiment는 일반적인 감성분석과 다를 수 있으며,
    이 함수는 기본적인 guard rails만 제공합니다.
    
    Args:
        raw: Raw sentiment dictionary with label, score, confidence
        
    Returns:
        Validated Sentiment schema
        
    Raises:
        SchemaViolation: If sentiment data is invalid
    """
    try:
        # Extract and validate label
        label = raw.get("label", "neutral")
        if label not in ("positive", "neutral", "negative"):
            label = "neutral"
        
        # Extract and clamp score to [-1, 1]
        score = float(raw.get("score", 0.0))
        score = max(-1.0, min(1.0, score))
        
        # Extract and clamp confidence to [0, 1]
        confidence = float(raw.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))
        
        # Optional rationale
        rationale = raw.get("rationale")
        if rationale is not None:
            rationale = str(rationale)
        
        return Sentiment(
            label=label,  # type: ignore
            score=score,
            confidence=confidence,
            rationale=rationale,
        )
    except (ValueError, TypeError, KeyError) as e:
        raise SchemaViolation(f"Invalid sentiment data: {e}") from e


async def analyze_sentiment(
    text: str,
    content_type: Literal["news", "social", "filing"],
    company_name: str | None = None,
    settings: Settings | None = None,
) -> Sentiment:
    """Analyze sentiment of text using OpenAI with structured output.
    
    This analyzes the text for stock-impact sentiment, not just general sentiment.
    It considers whether the content is likely to have a positive, negative, or
    neutral impact on the company's stock price.
    
    Args:
        text: The text to analyze (title + content/summary)
        content_type: Type of content being analyzed
        company_name: Optional company name for context
        settings: App settings (for OpenAI API key)
        
    Returns:
        Sentiment analysis result
        
    Raises:
        AIProviderError: If OpenAI API call fails
        SchemaViolation: If response doesn't match expected schema
    """
    if settings is None:
        settings = Settings()
    
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    # Build context-aware prompt
    context_map = {
        "news": "news article",
        "social": "social media post from employees or investors",
        "filing": "regulatory filing (DART)",
    }
    content_desc = context_map.get(content_type, "text")
    
    company_context = f" about {company_name}" if company_name else ""
    
    system_prompt = f"""You are a financial sentiment analyst specialized in Korean stock markets.
Analyze the following {content_desc}{company_context} and determine its likely impact on the company's stock price.

Focus on:
- Material business developments (earnings, products, partnerships, leadership changes)
- Market perception and investor sentiment
- Regulatory or legal implications
- Competitive positioning

Return sentiment as:
- label: "positive" (likely to increase stock price), "neutral" (no significant impact), or "negative" (likely to decrease stock price)
- score: numeric score from -1.0 (most negative) to +1.0 (most positive)
- confidence: your confidence in this assessment from 0.0 to 1.0
- rationale: brief explanation (optional, keep it concise)

Be conservative with extreme scores. Most content should be in the -0.3 to +0.3 range unless there's clear material impact."""

    # Define JSON schema for structured output
    response_schema = {
        "type": "object",
        "properties": {
            "label": {
                "type": "string",
                "enum": ["positive", "neutral", "negative"],
                "description": "Overall sentiment label"
            },
            "score": {
                "type": "number",
                "minimum": -1.0,
                "maximum": 1.0,
                "description": "Numeric sentiment score"
            },
            "confidence": {
                "type": "number",
                "minimum": 0.0,
                "maximum": 1.0,
                "description": "Confidence in the sentiment assessment"
            },
            "rationale": {
                "type": "string",
                "description": "Brief explanation for the sentiment",
                "nullable": True
            }
        },
        "required": ["label", "score", "confidence", "rationale"],
        "additionalProperties": False
    }
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "sentiment_analysis",
                    "strict": True,
                    "schema": response_schema
                }
            },
            temperature=0.3,  # Lower temperature for more consistent analysis
        )
        
        content = response.choices[0].message.content
        if not content:
            raise SchemaViolation("Empty response from OpenAI")
        
        result = json.loads(content)
        
        # Normalize and validate
        return normalize_sentiment(result)
        
    except json.JSONDecodeError as e:
        raise SchemaViolation(f"Failed to parse OpenAI response: {e}") from e
    except KeyError as e:
        raise SchemaViolation(f"Missing required field in OpenAI response: {e}") from e
    except Exception as e:
        raise AIProviderError(f"Error analyzing sentiment: {e}") from e

