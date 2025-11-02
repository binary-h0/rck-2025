# Intelligence Data Creation API

This document describes the endpoints for creating intelligence data (news articles, social posts, and DART filings) with automatic sentiment analysis.

## Overview

The API provides three POST endpoints for creating intelligence data:

1. **POST /v1/companies/{company_id}/news** - Create news article
2. **POST /v1/companies/{company_id}/social** - Create social media post
3. **POST /v1/companies/{company_id}/dart-filings** - Create DART filing

All endpoints:
- **No authentication required** - endpoints are open for public use
- Automatically analyze sentiment using OpenAI GPT-4o-mini
- Store the data with the analyzed sentiment in the database
- Return the created item with its sentiment

## Automatic Sentiment Analysis

When you create intelligence data, the API automatically:

1. Combines the title and content/summary
2. Sends it to OpenAI GPT-4o-mini for sentiment analysis
3. Returns a structured sentiment result with:
   - **label**: `"positive"`, `"neutral"`, or `"negative"`
   - **score**: Numeric score from `-1.0` (most negative) to `+1.0` (most positive)
   - **confidence**: Confidence level from `0.0` to `1.0`
   - **rationale**: Optional brief explanation

The sentiment analysis is specifically tuned for stock-impact sentiment, not just general sentiment. It considers:
- Material business developments
- Market perception and investor sentiment
- Regulatory or legal implications
- Competitive positioning

## Endpoints

### Create News Article

**POST** `/v1/companies/{company_id}/news`

Creates a news article with automatic sentiment analysis.

**Authentication**: Optional (not required)

**Request Body**:
```json
{
  "title": "삼성전자, 신규 반도체 공장 건설 발표",
  "source": "한국경제",
  "url": "https://example.com/article/123",
  "published_at": "2025-11-02T10:00:00Z",
  "summary": "삼성전자가 새로운 반도체 생산시설 건설을 발표했습니다.",
  "company_id": "005930"
}
```

**Response** (201 Created):
```json
{
  "id": "article_a1b2c3d4e5f6",
  "title": "삼성전자, 신규 반도체 공장 건설 발표",
  "source": "한국경제",
  "url": "https://example.com/article/123",
  "published_at": "2025-11-02T10:00:00Z",
  "summary": "삼성전자가 새로운 반도체 생산시설 건설을 발표했습니다.",
  "sentiment": {
    "label": "positive",
    "score": 0.65,
    "confidence": 0.82,
    "rationale": "Major capital investment in semiconductor manufacturing capacity"
  },
  "company_id": "005930"
}
```

### Create Social Post

**POST** `/v1/companies/{company_id}/social`

Creates a social media post (Blind or Naver forum) with automatic sentiment analysis.

**Authentication**: Optional (not required)

**Request Body**:
```json
{
  "platform": "blind",
  "title": "올해 실적 전망",
  "content": "올해 실적이 작년보다 좋을 것 같습니다.",
  "author": "익명_사원",
  "dept": "경영지원",
  "posted_at": "2025-11-01T15:30:00Z",
  "company_id": "005930",
  "reply_count": 5,
  "like_count": 12
}
```

**Response** (201 Created):
```json
{
  "id": "post_g7h8i9j0k1l2",
  "platform": "blind",
  "title": "올해 실적 전망",
  "content": "올해 실적이 작년보다 좋을 것 같습니다.",
  "author": "익명_사원",
  "dept": "경영지원",
  "posted_at": "2025-11-01T15:30:00Z",
  "sentiment": {
    "label": "positive",
    "score": 0.35,
    "confidence": 0.65,
    "rationale": "Employee expressing optimism about company performance"
  },
  "company_id": "005930",
  "reply_count": 5,
  "like_count": 12
}
```

**Note**: The `dept` field is only valid for `platform: "blind"`. If you provide `dept` for `naver_forum`, you'll get a validation error.

### Create DART Filing

**POST** `/v1/companies/{company_id}/dart-filings`

Creates a DART regulatory filing with automatic sentiment analysis.

**Authentication**: Optional (not required)

**Request Body**:
```json
{
  "title": "분기보고서 (2025.09)",
  "filing_type": "분기보고서",
  "filed_at": "2025-11-01T09:00:00Z",
  "url": "https://dart.fss.or.kr/filing/789",
  "summary": "2025년 3분기 실적 보고",
  "company_id": "005930"
}
```

**Response** (201 Created):
```json
{
  "id": "filing_m3n4o5p6q7r8",
  "title": "분기보고서 (2025.09)",
  "filing_type": "분기보고서",
  "filed_at": "2025-11-01T09:00:00Z",
  "url": "https://dart.fss.or.kr/filing/789",
  "summary": "2025년 3분기 실적 보고",
  "sentiment": {
    "label": "neutral",
    "score": 0.0,
    "confidence": 0.8,
    "rationale": "Routine quarterly report, no material new information"
  },
  "company_id": "005930"
}
```

## Error Handling

### 404 Not Found
The specified company doesn't exist.

### 422 Unprocessable Entity
Invalid request data (e.g., `company_id` in path doesn't match body, validation errors).

### 503 Service Unavailable
OpenAI API is unavailable or returned an error.

## Implementation Details

### Sentiment Analysis

The sentiment analysis is performed by the `analyze_sentiment()` function in `app/services/sentiment.py`. It uses:

- **Model**: `gpt-4o-mini`
- **Temperature**: `0.3` (for consistent analysis)
- **Response Format**: JSON Schema with structured output
- **Prompt**: Context-aware prompt that considers:
  - Type of content (news, social, filing)
  - Company name
  - Stock-impact focus (not just general sentiment)

### Repository Layer

Each intelligence type has a corresponding repository with a `create_*` method:

- `NewsRepository.create_article()`
- `SocialRepository.create_social_post()`
- `DartRepository.create_filing()`

These methods:
- Generate a unique ID (e.g., `article_a1b2c3d4e5f6`)
- Store the data in the database
- Include the sentiment as JSONB
- Return the created item as a Pydantic schema

### Database Storage

The sentiment is stored as JSONB in the database:

```sql
sentiment JSONB DEFAULT NULL
```

Example stored value:
```json
{
  "label": "positive",
  "score": 0.65,
  "confidence": 0.82,
  "rationale": "Major capital investment in semiconductor manufacturing capacity"
}
```

## Authentication

These endpoints do not require authentication. They are open for public use:

```bash
curl -X POST http://localhost:8000/v1/companies/005930/news \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Note**: If you want to add authentication in the future, you can add a bearer token check in the endpoint implementation.

## Example Workflow

1. **Create a news article**:
```bash
curl -X POST http://localhost:8000/v1/companies/005930/news \
  -H "Content-Type: application/json" \
  -d '{
    "title": "삼성전자, 반도체 신기술 개발 성공",
    "source": "한국경제",
    "published_at": "2025-11-02T10:00:00Z",
    "summary": "차세대 3나노 공정 기술 개발에 성공하여 시장 경쟁력 강화 전망",
    "company_id": "005930"
  }'
```

2. **Fetch the news** (including the newly created article):
```bash
curl "http://localhost:8000/v1/companies/005930/news?limit=10"
```

3. **Use in prediction** (sentiment is automatically included in the feature analysis):
```bash
curl -X POST http://localhost:8000/v1/companies/005930/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "horizon_days": 7,
    "target": "return",
    "include_features": {
      "news": true,
      "blind": true,
      "naver_forum": true,
      "filings": true,
      "prices": true
    }
  }'
```

## Testing

To test the endpoints in memory mode (without PostgreSQL):

```bash
# Set environment
export DATABASE_URL="memory"
export OPENAI_API_KEY="your-key-here"

# Run the server
make run

# Create test data
curl -X POST http://localhost:8000/v1/companies/005930/news \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Rate Limits

Each POST request makes one call to the OpenAI API for sentiment analysis. Be mindful of:
- OpenAI API rate limits
- OpenAI API costs (gpt-4o-mini is very cost-effective)

## Future Enhancements

Possible future improvements:

1. **Batch creation**: Create multiple items in a single request
2. **Manual sentiment override**: Allow users to provide their own sentiment
3. **Sentiment history**: Track how sentiment changes over time
4. **Sentiment aggregation**: Calculate average sentiment for a company
5. **Webhook notifications**: Notify subscribers when new intelligence is added

