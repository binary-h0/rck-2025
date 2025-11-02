# Changelog: Intelligence Creation Feature

## Summary

Added POST endpoints to create intelligence data (news articles, social posts, and DART filings) with automatic AI-powered sentiment analysis using OpenAI GPT-4o-mini.

## New Features

### 1. Sentiment Analysis Service (`app/services/sentiment.py`)

- Implemented `analyze_sentiment()` function using OpenAI GPT-4o-mini
- Analyzes text for stock-impact sentiment (not just general sentiment)
- Returns structured sentiment with:
  - `label`: positive, neutral, or negative
  - `score`: -1.0 to +1.0
  - `confidence`: 0.0 to 1.0
  - `rationale`: Optional explanation
- Uses JSON Schema with structured output for reliable parsing
- Temperature set to 0.3 for consistent analysis
- Context-aware prompts based on content type (news, social, filing)

### 2. Request Schemas (`app/schemas/intelligence.py`)

Added three new request schemas:

- `CreateArticleRequest`: For creating news articles
- `CreateSocialPostRequest`: For creating social posts (Blind/Naver)
- `CreateFilingRequest`: For creating DART filings

Each schema includes:
- Field validation (length, format)
- Optional fields where appropriate
- Example documentation

Special validation:
- `CreateSocialPostRequest` validates that `dept` is only provided for Blind platform

### 3. Repository Methods

Added create methods to each repository:

- `NewsRepository.create_article()` - Create news article
- `SocialRepository.create_social_post()` - Create social post
- `DartRepository.create_filing()` - Create DART filing

Each method:
- Generates unique IDs (e.g., `article_a1b2c3d4e5f6`)
- Converts sentiment to JSONB
- Stores in database with async SQLAlchemy
- Returns the created item as Pydantic schema

### 4. POST Endpoints (`app/routers/intelligence.py`)

Added three new POST endpoints:

- `POST /v1/companies/{company_id}/news`
- `POST /v1/companies/{company_id}/social`
- `POST /v1/companies/{company_id}/dart-filings`

Each endpoint:
- Requires authentication with `intelligence:write` scope
- Validates company exists
- Analyzes sentiment automatically
- Stores data with sentiment
- Returns 201 Created with full object including sentiment

### 5. Error Handling (`app/errors.py`)

Added new error classes:

- `AIProviderError`: For OpenAI API errors (503)
- `NotFoundError`: Alias for `NotFound` (404)
- `ValidationError`: Alias for `Unprocessable` (422)

## Files Modified

### Core Implementation

1. **`app/services/sentiment.py`**
   - Implemented full sentiment analysis with OpenAI
   - Added structured output with JSON Schema
   - Context-aware prompts for different content types

2. **`app/schemas/intelligence.py`**
   - Added `CreateArticleRequest`
   - Added `CreateSocialPostRequest`
   - Added `CreateFilingRequest`
   - Added field validators

3. **`app/repositories/news_repo.py`**
   - Added `import uuid`
   - Added `create_article()` method

4. **`app/repositories/social_repo.py`**
   - Added `import uuid`
   - Added `from typing import Literal`
   - Added `create_social_post()` method

5. **`app/repositories/dart_repo.py`**
   - Added `import uuid`
   - Added `create_filing()` method

6. **`app/routers/intelligence.py`**
   - Added imports for auth, errors, and new schemas
   - Added `create_news_article()` endpoint
   - Added `create_social_post()` endpoint
   - Added `create_dart_filing()` endpoint

7. **`app/errors.py`**
   - Added `AIProviderError` class
   - Added `NotFoundError` alias
   - Added `ValidationError` alias

### Documentation

1. **`README.md`**
   - Updated Features section
   - Added example usage for all three POST endpoints
   - Included curl commands with authentication

2. **`INTELLIGENCE_CREATION.md`** (NEW)
   - Comprehensive guide to intelligence creation API
   - Detailed endpoint documentation
   - Request/response examples
   - Error handling guide
   - Implementation details
   - Testing instructions
   - Future enhancement ideas

3. **`test_intelligence_creation.sh`** (NEW)
   - Test script for all three endpoints
   - Tests success cases
   - Tests error cases
   - Verifies data creation
   - Uses jq for JSON processing

4. **`CHANGELOG_INTELLIGENCE.md`** (NEW)
   - This file - detailed changelog

## API Examples

### Create News Article

```bash
curl -X POST http://localhost:8000/v1/companies/005930/news \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "삼성전자, 신규 반도체 공장 건설 발표",
    "source": "한국경제",
    "published_at": "2025-11-02T10:00:00Z",
    "summary": "삼성전자가 새로운 반도체 생산시설 건설을 발표했습니다.",
    "company_id": "005930"
  }'
```

Response:
```json
{
  "id": "article_a1b2c3d4e5f6",
  "title": "삼성전자, 신규 반도체 공장 건설 발표",
  "source": "한국경제",
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

```bash
curl -X POST http://localhost:8000/v1/companies/005930/social \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "blind",
    "title": "올해 실적 전망",
    "content": "올해 실적이 작년보다 좋을 것 같습니다.",
    "author": "익명_사원",
    "dept": "경영지원",
    "posted_at": "2025-11-01T15:30:00Z",
    "company_id": "005930"
  }'
```

### Create DART Filing

```bash
curl -X POST http://localhost:8000/v1/companies/005930/dart-filings \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "분기보고서 (2025.09)",
    "filing_type": "분기보고서",
    "filed_at": "2025-11-01T09:00:00Z",
    "summary": "2025년 3분기 실적 보고",
    "company_id": "005930"
  }'
```

## Authentication & Authorization

All POST endpoints require:
- Bearer token in `Authorization` header
- Token must have `intelligence:write` scope
- Enforced via `require_scopes(["intelligence:write"])` dependency

Example:
```python
token: Annotated[AuthToken, Depends(require_scopes(["intelligence:write"]))]
```

## Validation

Each endpoint validates:
1. **Company exists**: Queries `CompaniesRepository` to ensure company_id is valid
2. **Path/body match**: Ensures `company_id` in URL path matches `company_id` in request body
3. **Field constraints**: Pydantic validates all field types, lengths, and formats
4. **Platform-specific rules**: E.g., `dept` only valid for Blind posts

## Database Schema

No schema changes required! The sentiment is stored in the existing JSONB columns:

```sql
-- news_articles table
sentiment JSONB DEFAULT NULL

-- social_posts table
sentiment JSONB DEFAULT NULL

-- dart_filings table
sentiment JSONB DEFAULT NULL
```

## Testing

Run the test script:

```bash
# Start the server
make run

# In another terminal
./test_intelligence_creation.sh
```

The script will:
- Create a news article
- Create a Blind post
- Create a Naver forum post
- Create a DART filing
- Verify all items were created
- Test error cases

## Performance Considerations

Each POST request makes one OpenAI API call:
- Model: `gpt-4o-mini` (very cost-effective)
- Average latency: 1-3 seconds
- Cost: ~$0.0001-0.0002 per request

For high-volume scenarios, consider:
- Batch processing
- Async workers (Celery, RQ)
- Caching similar sentiments

## Future Enhancements

Possible improvements:

1. **Batch creation**: Create multiple items in one request
2. **Manual sentiment override**: Let users provide their own sentiment
3. **Sentiment recalculation**: Re-analyze sentiment for existing items
4. **Sentiment trends**: Aggregate sentiment over time
5. **Webhook notifications**: Notify subscribers of new intelligence
6. **Rate limiting**: Implement per-user rate limits
7. **Async sentiment**: Queue sentiment analysis for faster response
8. **Sentiment caching**: Cache similar texts to reduce API calls

## Breaking Changes

None - all changes are additive.

## Migration Required

None - the endpoints work with the existing database schema.

## Dependencies

No new dependencies added - all required packages were already in use:
- `openai` (already used for predictions)
- `pydantic` (already used throughout)
- `sqlalchemy` (already used for database)

## Configuration

No new configuration required - uses existing OpenAI API key:

```bash
OPENAI_API_KEY=your-key-here
```

## Security Considerations

1. **Authentication**: All POST endpoints require valid bearer token
2. **Authorization**: Token must have `intelligence:write` scope
3. **Input validation**: All inputs validated via Pydantic
4. **SQL injection**: Protected by SQLAlchemy ORM
5. **Rate limiting**: Consider adding rate limits in production
6. **API key exposure**: OpenAI key loaded from environment variables

## Monitoring & Logging

Consider monitoring:
- OpenAI API call success/failure rates
- Sentiment distribution (positive/negative/neutral)
- Average confidence scores
- API latency
- Error rates

## Rollback Plan

If issues arise:
1. Remove POST endpoints from `app/routers/intelligence.py`
2. Revert `app/services/sentiment.py` to previous version
3. No database changes needed (JSONB columns were already present)

## Contact

For questions or issues, refer to:
- `INTELLIGENCE_CREATION.md` - Full API documentation
- `README.md` - General project documentation
- `ASSUMPTIONS.md` - Design decisions

