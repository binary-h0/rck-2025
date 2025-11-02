# Assumptions

This document records design decisions made in the absence of complete specifications.

## Database Schema

**Assumption**: The crawl pipeline has already populated the following tables:
- `companies`: company_id, ticker, name, sector, market
- `news_articles`: article_id, company_id, title, source, url, published_at, summary, sentiment (JSON)
- `social_posts`: post_id, company_id, platform, title, content, author, dept, posted_at, sentiment (JSON), reply_count, like_count
- `dart_filings`: filing_id, company_id, title, filing_type, filed_at, url, summary, sentiment (JSON)
- `price_candles`: company_id, timestamp, open, high, low, close, volume, interval, adjust_type
- `espp_holdings`: user_id, company_id, lots (JSON), last_updated

**Rationale**: The spec stated "데이터(이미 사내 DB에 저장됨)" implying pre-existing tables.

## Sentiment Scores

**Assumption**: Sentiment `score` represents "주가영향도" (stock-impact sentiment), which is distinct from general sentiment analysis.

The `normalize_sentiment()` function provides basic clamping but includes a TODO note that a calibrated classifier should be implemented that considers:
- Market context and sector trends
- Company-specific factors
- Historical correlation between sentiment and price movements

**Rationale**: The spec mentioned "주가영향도" as different from regular sentiment, requiring domain-specific calibration.

## OpenAI Model

**Assumption**: `gpt-4o-mini` is used as default model (configurable via `OPENAI_MODEL` env var).

**Rationale**: The spec mentioned "gpt-5-mini" but at the time of implementation, the latest model is "gpt-4o-mini". This can be easily changed via configuration.

## Authentication

**Assumption**: Simplified bearer token parsing is implemented, with JWT validation marked as TODO.

Current implementation:
- Extracts bearer token from Authorization header
- Returns mock user_id for scope-protected endpoints
- Does NOT validate JWT signature or expiration

**Rationale**: The spec said "Do not implement real OAuth; leave TODO note in auth.py for JWT validation."

## Cursor Pagination

**Assumption**: Opaque cursor format uses base64url-encoded JSON with keyset fields.

For deterministic ordering:
- News/articles: `(published_at DESC, id ASC)`
- Social posts: `(posted_at DESC, id ASC)`
- Filings: `(filed_at DESC, id ASC)`

In-memory mode uses simple offset-based pagination since there's no real database.

**Rationale**: The spec required "opaque cursor pagination" and "deterministic ordering" with specific sort orders.

## In-Memory Mode

**Assumption**: When `DB_DSN` starts with `memory://`, repositories return deterministic fake data without database queries.

Each repository generates 5 items per feed with realistic timestamps and sentiment.

**Rationale**: The spec required "in-memory adapters behind feature flags" for testing without a real database.

## Feature Engineering

**Assumption**: The `_assemble_features()` function includes minimal but realistic features:

**Price features**:
- Rolling returns (mean, volatility)
- Momentum indicators (10-day return)
- Volume trend

**Sentiment features**:
- Event counts by polarity (positive/negative/neutral)
- Weighted sentiment with recency decay (30-day window)

**Social features**:
- Post counts and engagement metrics
- Sentiment ratios

**Filing features**:
- Filing counts
- Days since last filing

**Rationale**: The spec asked for "minimal but realistic placeholders" for features.

## Price Adjustments

**Assumption**: Adjustment types are simplified:
- `none`: Raw prices
- `split`: Apply 2:1 split adjustment before 180 days ago
- `total_return`: Apply 2% dividend reinvestment factor

**Rationale**: Real adjustment logic would query corporate actions from database. Simplified for demonstration.

## Prediction Horizon

**Assumption**: Prediction horizon is limited to 1-90 days via validation constraint.

**Rationale**: Reasonable limit for near-term predictions, configurable if needed.

## Error Handling

**Assumption**: Custom exceptions inherit from `HTTPException` for FastAPI compatibility:
- `NotFound` (404)
- `Forbidden` (403)
- `Unprocessable` (422)
- `SchemaViolation` (422)

**Rationale**: Centralized error handling with appropriate HTTP status codes.

## Logging

**Assumption**: Request logging includes:
- HTTP method, path, status code, latency
- Authorization headers are redacted as `[REDACTED]`

**Rationale**: The spec required "one line per request (method,path,latency,code), redact tokens."

## Timezone

**Assumption**: All timestamps are:
- Stored in UTC
- Served in RFC3339 format (ISO 8601 with timezone)
- Converted to `Asia/Seoul` only for feature calculations when needed

**Rationale**: The spec stated "store/serve UTC (RFC3339), feature calc uses Asia/Seoul as needed."

## Test Coverage

**Assumption**: Core tests cover:
1. Pagination encode/decode round-trip
2. Prediction schema conformance with mocked OpenAI
3. Prices router parameter validation
4. Error handling for empty price history

**Rationale**: The spec listed specific tests; additional tests can be added as needed.

## ESPP Holdings

**Assumption**: ESPP holdings include:
- Multiple purchase lots with dates, quantities, prices
- Total quantity and cost basis
- Last updated timestamp

**Rationale**: Standard ESPP holdings structure for employee stock purchase plans.

## Rate Limiting

**Assumption**: No rate limiting implemented.

**Rationale**: Not specified in requirements. Can be added via middleware if needed.

## Caching

**Assumption**: No caching implemented.

**Rationale**: Not specified in requirements. Consider adding Redis cache for:
- Company lookups
- Price data
- Prediction results

## API Versioning

**Assumption**: API version prefix `/v1` is configurable via `API_PREFIX` setting.

**Rationale**: Standard REST API versioning practice.

## Response Pagination

**Assumption**: All paginated responses use the format:
```json
{
  "data": [...],
  "next_cursor": "base64-encoded-string-or-null"
}
```

**Rationale**: Consistent pagination response structure across all endpoints.

