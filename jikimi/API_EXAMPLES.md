# API Examples

Complete examples for using the Equity Intelligence API.

## Setup

```bash
# Set your API URL
export API_URL="http://localhost:8000/v1"

# Set your auth token (for holdings endpoint)
export AUTH_TOKEN="your-bearer-token"
```

## Companies

### Search Companies

```bash
# Search all companies
curl "$API_URL/companies"

# Search with query
curl "$API_URL/companies?q=삼성"

# Search with pagination
curl "$API_URL/companies?limit=10&cursor=eyJvZmZzZXQiOjEwfQ"
```

**Response:**
```json
{
  "data": [
    {
      "id": "005930",
      "ticker": "005930.KS",
      "name": "삼성전자",
      "sector": "Technology",
      "market": "KOSPI"
    }
  ],
  "next_cursor": "eyJvZmZzZXQiOjEwfQ"
}
```

### Get Company by ID

```bash
curl "$API_URL/companies/005930"
```

**Response:**
```json
{
  "id": "005930",
  "ticker": "005930.KS",
  "name": "삼성전자",
  "sector": "Technology",
  "market": "KOSPI"
}
```

## Intelligence Data

### Get News Articles

```bash
# Get all news for a company
curl "$API_URL/companies/005930/news"

# Filter by date range
curl "$API_URL/companies/005930/news?start=2025-10-01T00:00:00Z&end=2025-11-01T00:00:00Z"

# Filter by sources
curl "$API_URL/companies/005930/news?sources=한국경제&sources=매일경제"

# Paginate results
curl "$API_URL/companies/005930/news?limit=20&cursor=eyJvZmZzZXQiOjIwfQ"
```

**Response:**
```json
{
  "data": [
    {
      "id": "article_123",
      "title": "삼성전자, 신규 반도체 공장 건설 발표",
      "source": "한국경제",
      "url": "https://example.com/article/123",
      "published_at": "2025-11-02T10:00:00Z",
      "summary": "삼성전자가 새로운 반도체 생산시설 건설을 발표했습니다.",
      "sentiment": {
        "label": "positive",
        "score": 0.8,
        "confidence": 0.9,
        "rationale": "Major infrastructure investment indicates growth"
      },
      "company_id": "005930"
    }
  ],
  "next_cursor": "eyJvZmZzZXQiOjIwfQ"
}
```

### Get 블라인드 Posts

```bash
# Get all blind posts
curl "$API_URL/companies/005930/blind-posts"

# Filter by department
curl "$API_URL/companies/005930/blind-posts?dept=경영지원"

# Filter by date range
curl "$API_URL/companies/005930/blind-posts?start=2025-10-01T00:00:00Z&end=2025-11-01T00:00:00Z"
```

**Response:**
```json
{
  "data": [
    {
      "id": "post_456",
      "platform": "blind",
      "title": "올해 실적 전망",
      "content": "올해 실적이 작년보다 좋을 것 같습니다.",
      "author": "익명_사원",
      "dept": "경영지원",
      "posted_at": "2025-11-01T15:30:00Z",
      "sentiment": {
        "label": "positive",
        "score": 0.6,
        "confidence": 0.7
      },
      "company_id": "005930",
      "reply_count": 5,
      "like_count": 12
    }
  ],
  "next_cursor": null
}
```

### Get 네이버 종토방 Posts

```bash
curl "$API_URL/companies/005930/naver-forum"
```

### Get DART Filings

```bash
# Get all filings
curl "$API_URL/companies/005930/dart-filings"

# Filter by filing type
curl "$API_URL/companies/005930/dart-filings?type=분기보고서"

# Filter by date range
curl "$API_URL/companies/005930/dart-filings?start=2025-01-01T00:00:00Z"
```

**Response:**
```json
{
  "data": [
    {
      "id": "filing_789",
      "title": "분기보고서 (2025.09)",
      "filing_type": "분기보고서",
      "filed_at": "2025-11-01T09:00:00Z",
      "url": "https://dart.fss.or.kr/filing/789",
      "summary": "2025년 3분기 실적 보고",
      "sentiment": {
        "label": "neutral",
        "score": 0.0,
        "confidence": 0.8
      },
      "company_id": "005930"
    }
  ],
  "next_cursor": null
}
```

## Market Data

### Get Historical Prices

```bash
# Get daily prices
curl "$API_URL/companies/005930/prices?interval=1d"

# Get hourly prices
curl "$API_URL/companies/005930/prices?interval=1h"

# Get 5-minute prices
curl "$API_URL/companies/005930/prices?interval=5m"

# Get split-adjusted prices
curl "$API_URL/companies/005930/prices?interval=1d&adjust=split"

# Get total return prices (dividends reinvested)
curl "$API_URL/companies/005930/prices?interval=1d&adjust=total_return"

# Filter by date range
curl "$API_URL/companies/005930/prices?start=2025-10-01T00:00:00Z&end=2025-11-01T00:00:00Z&interval=1d"
```

**Response:**
```json
{
  "company": {
    "id": "005930",
    "ticker": "005930.KS"
  },
  "candles": [
    {
      "t": "2025-11-01T00:00:00Z",
      "o": 74500.0,
      "h": 75200.0,
      "l": 74000.0,
      "c": 75000.0,
      "v": 12000000
    },
    {
      "t": "2025-11-02T00:00:00Z",
      "o": 75000.0,
      "h": 76500.0,
      "l": 74800.0,
      "c": 76000.0,
      "v": 15000000
    }
  ]
}
```

## Price Prediction

### Predict Stock Price

```bash
# Basic prediction
curl -X POST "$API_URL/companies/005930/predict-price" \
  -H "Content-Type: application/json" \
  -d '{
    "horizon_days": 7,
    "target": "return"
  }'

# Custom features
curl -X POST "$API_URL/companies/005930/predict-price" \
  -H "Content-Type: application/json" \
  -d '{
    "horizon_days": 14,
    "target": "close",
    "include_features": {
      "news": true,
      "blind": true,
      "naver_forum": true,
      "filings": true,
      "prices": true
    },
    "retrain": false
  }'

# Predict with only price data
curl -X POST "$API_URL/companies/005930/predict-price" \
  -H "Content-Type: application/json" \
  -d '{
    "horizon_days": 7,
    "target": "close",
    "include_features": {
      "news": false,
      "blind": false,
      "naver_forum": false,
      "filings": false,
      "prices": true
    }
  }'
```

**Response:**
```json
{
  "company": {
    "id": "005930",
    "ticker": "005930.KS"
  },
  "as_of": "2025-11-02T12:00:00Z",
  "horizon_days": 7,
  "method": "gpt-4o-mini",
  "predicted_series": [
    {
      "t": "2025-11-03T00:00:00Z",
      "y": 76500.0,
      "uncertainty": {
        "lower": 75000.0,
        "upper": 78000.0
      }
    },
    {
      "t": "2025-11-04T00:00:00Z",
      "y": 77000.0,
      "uncertainty": {
        "lower": 75500.0,
        "upper": 78500.0
      }
    }
  ],
  "feature_importance": [
    {
      "name": "news_sentiment",
      "importance": 0.35
    },
    {
      "name": "price_momentum",
      "importance": 0.25
    },
    {
      "name": "volume_trend",
      "importance": 0.15
    }
  ],
  "rationale_md": "Based on recent positive news and strong price momentum..."
}
```

## Holdings

### Get ESPP Holdings

**Requires authentication with `holdings.read` scope**

```bash
curl "$API_URL/me/holdings/espp" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

**Response:**
```json
{
  "user_id": "user_123",
  "company": {
    "id": "005930",
    "ticker": "005930.KS"
  },
  "total_quantity": 250,
  "total_cost_basis": 17500000.0,
  "lots": [
    {
      "lot_id": "lot_2024_q1",
      "purchase_date": "2024-03-15T00:00:00Z",
      "quantity": 100,
      "purchase_price": 70000.0,
      "cost_basis": 7000000.0
    },
    {
      "lot_id": "lot_2024_q2",
      "purchase_date": "2024-06-15T00:00:00Z",
      "quantity": 150,
      "purchase_price": 70000.0,
      "cost_basis": 10500000.0
    }
  ],
  "last_updated": "2025-11-02T12:00:00Z"
}
```

## Error Handling

### 404 Not Found

```bash
curl "$API_URL/companies/INVALID"
```

**Response:**
```json
{
  "detail": "Company INVALID not found"
}
```

### 422 Validation Error

```bash
curl "$API_URL/companies/005930/prices?interval=invalid"
```

**Response:**
```json
{
  "detail": [
    {
      "type": "enum",
      "loc": ["query", "interval"],
      "msg": "Input should be '1d', '1h' or '5m'",
      "input": "invalid"
    }
  ]
}
```

### 403 Forbidden (Missing Auth)

```bash
curl "$API_URL/me/holdings/espp"
```

**Response:**
```json
{
  "detail": "Missing or invalid authorization token"
}
```

## Pagination

All list endpoints support cursor-based pagination:

```bash
# First page
curl "$API_URL/companies?limit=10"

# Next page (use cursor from previous response)
curl "$API_URL/companies?limit=10&cursor=eyJvZmZzZXQiOjEwfQ"
```

**Key points:**
- Cursors are opaque strings - don't parse or modify them
- Cursors are stable for 24 hours
- `next_cursor` is `null` when there are no more results
- Default limit varies by endpoint, max is 200

## Batch Examples

### Complete Company Analysis

Get all intelligence data for a company:

```bash
#!/bin/bash
COMPANY_ID="005930"
API_URL="http://localhost:8000/v1"

# Get company info
curl "$API_URL/companies/$COMPANY_ID" > company.json

# Get recent news
curl "$API_URL/companies/$COMPANY_ID/news?limit=50" > news.json

# Get blind posts
curl "$API_URL/companies/$COMPANY_ID/blind-posts?limit=50" > blind.json

# Get naver forum
curl "$API_URL/companies/$COMPANY_ID/naver-forum?limit=50" > naver.json

# Get filings
curl "$API_URL/companies/$COMPANY_ID/dart-filings?limit=20" > filings.json

# Get price history
curl "$API_URL/companies/$COMPANY_ID/prices?interval=1d" > prices.json

# Generate prediction
curl -X POST "$API_URL/companies/$COMPANY_ID/predict-price" \
  -H "Content-Type: application/json" \
  -d '{"horizon_days": 7, "target": "return"}' > prediction.json

echo "Analysis complete! Check JSON files."
```

## Python Client Example

```python
import httpx
from datetime import datetime, timedelta

class EquityClient:
    def __init__(self, base_url: str = "http://localhost:8000/v1"):
        self.client = httpx.AsyncClient(base_url=base_url)
    
    async def search_companies(self, q: str = None, limit: int = 50):
        params = {"limit": limit}
        if q:
            params["q"] = q
        response = await self.client.get("/companies", params=params)
        response.raise_for_status()
        return response.json()
    
    async def get_news(self, company_id: str, limit: int = 50):
        response = await self.client.get(
            f"/companies/{company_id}/news",
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()
    
    async def predict_price(self, company_id: str, horizon_days: int = 7):
        response = await self.client.post(
            f"/companies/{company_id}/predict-price",
            json={"horizon_days": horizon_days, "target": "return"}
        )
        response.raise_for_status()
        return response.json()

# Usage
async def main():
    client = EquityClient()
    
    # Search companies
    companies = await client.search_companies(q="삼성")
    print(f"Found {len(companies['data'])} companies")
    
    # Get news
    news = await client.get_news("005930")
    print(f"Found {len(news['data'])} news articles")
    
    # Predict price
    prediction = await client.predict_price("005930", horizon_days=7)
    print(f"Prediction: {prediction['predicted_series'][0]['y']}")

# Run
import asyncio
asyncio.run(main())
```

