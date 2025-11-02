# Equity Intelligence API

A production-grade FastAPI service for stock intelligence and price prediction.

## Features

- **Company Search**: Search and retrieve company information
- **Intelligence Feeds**: Access news, 블라인드 posts, 네이버 종토방, and DART filings with sentiment analysis
- **Create Intelligence Data**: POST endpoints to add news articles, social posts, and DART filings with automatic AI-powered sentiment analysis
- **Market Data**: Historical OHLCV price data with multiple intervals and adjustments (live data from Yahoo Finance)
- **AI Predictions**: Stock price predictions using OpenAI GPT-4o-mini with structured output
- **Holdings**: Authenticated access to ESPP/우리사주 holdings
- **Cursor Pagination**: Efficient, opaque cursor-based pagination for all list endpoints
- **Async Architecture**: Full async/await with SQLAlchemy 2.x async
- **Type Safety**: Strict type checking with mypy and Pydantic v2

## Prerequisites

- Python 3.11+
- PostgreSQL (or use in-memory mode for testing)
- OpenAI API key

## Installation

```bash
# Clone the repository
cd equity_api

# Install dependencies
make install

# Copy environment template
cp .env.example .env

# Edit .env and set your configuration
nano .env
```

## Database Setup

### PostgreSQL (Production)

```bash
# 1. Create database
createdb equity

# 2. Run schema script
psql -U your_user -d equity -f db/schema.sql

# 3. Load seed data
psql -U your_user -d equity -f db/seed.sql

# See db/README.md for detailed instructions
```

### In-Memory Mode (Testing)

For quick testing without a database:

```bash
# In .env
DB_DSN=memory://fake
```

## Configuration

Edit `.env` file:

```bash
# API Configuration
API_PREFIX=/v1

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Database Configuration
DB_DSN=postgresql+asyncpg://user:password@localhost:5432/equity
# For testing with in-memory fake data:
# DB_DSN=memory://fake

# Application Settings
DEFAULT_TZ=Asia/Seoul
MAX_PAGE_SIZE=200
```

## Running

### Development Server

```bash
make run
```

Server will start at `http://localhost:8000`

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Example Usage

### Health Check

```bash
curl http://localhost:8000/healthz
```

### Search Companies

```bash
curl "http://localhost:8000/v1/companies?q=삼성&limit=10"
```

### Get Company Details

```bash
curl http://localhost:8000/v1/companies/005930
```

### Get News with Sentiment

```bash
curl "http://localhost:8000/v1/companies/005930/news?limit=20&cursor=eyJvZmZzZXQiOjIwfQ"
```

### Create News Article with Sentiment Analysis

```bash
curl -X POST http://localhost:8000/v1/companies/005930/news \
  -H "Content-Type: application/json" \
  -d '{
    "title": "삼성전자, 신규 반도체 공장 건설 발표",
    "source": "한국경제",
    "url": "https://example.com/article/123",
    "published_at": "2025-11-02T10:00:00Z",
    "summary": "삼성전자가 새로운 반도체 생산시설 건설을 발표했습니다.",
    "company_id": "005930"
  }'
```

### Create Social Post with Sentiment Analysis

```bash
curl -X POST http://localhost:8000/v1/companies/005930/social \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "blind",
    "title": "올해 실적 전망",
    "content": "올해 실적이 작년보다 좋을 것 같습니다.",
    "author": "익명_사원",
    "dept": "경영지원",
    "posted_at": "2025-11-01T15:30:00Z",
    "company_id": "005930",
    "reply_count": 5,
    "like_count": 12
  }'
```

### Create DART Filing with Sentiment Analysis

```bash
curl -X POST http://localhost:8000/v1/companies/005930/dart-filings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "분기보고서 (2025.09)",
    "filing_type": "분기보고서",
    "filed_at": "2025-11-01T09:00:00Z",
    "url": "https://dart.fss.or.kr/filing/789",
    "summary": "2025년 3분기 실적 보고",
    "company_id": "005930"
  }'
```

### Get Historical Prices

```bash
curl "http://localhost:8000/v1/companies/005930/prices?interval=1d&adjust=split"
```

### Predict Stock Price

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

### Get ESPP Holdings (Requires Auth)

```bash
curl http://localhost:8000/v1/me/holdings/espp \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Development

### Format Code

```bash
make fmt
```

### Lint

```bash
make lint
```

### Type Check

```bash
make typecheck
```

### Run Tests

```bash
make test
```

### Clean Build Artifacts

```bash
make clean
```

## Project Structure

```
equity_api/
├── app/
│   ├── main.py              # FastAPI application factory
│   ├── config.py            # Settings and configuration
│   ├── auth.py              # Authentication/authorization
│   ├── deps.py              # Dependency injection
│   ├── errors.py            # Custom exceptions
│   ├── utils/               # Utility modules
│   │   ├── pagination.py    # Cursor pagination
│   │   ├── time.py          # Time/timezone utilities
│   │   └── hashing.py       # Hashing utilities
│   ├── schemas/             # Pydantic models
│   │   ├── common.py        # Shared schemas
│   │   ├── company.py       # Company schemas
│   │   ├── intelligence.py  # Intelligence schemas
│   │   ├── market.py        # Market data schemas
│   │   ├── prediction.py    # Prediction schemas
│   │   └── holdings.py      # Holdings schemas
│   ├── repositories/        # Data access layer
│   │   ├── base.py
│   │   ├── companies_repo.py
│   │   ├── news_repo.py
│   │   ├── social_repo.py
│   │   ├── dart_repo.py
│   │   ├── prices_repo.py
│   │   └── holdings_repo.py
│   ├── services/            # Business logic
│   │   ├── sentiment.py     # Sentiment normalization
│   │   └── prediction.py    # Price prediction
│   └── routers/             # API endpoints
│       ├── companies.py
│       ├── intelligence.py
│       ├── market.py
│       ├── prediction.py
│       └── holdings.py
├── tests/                   # Test suite
├── pyproject.toml          # Dependencies and tool config
├── Makefile               # Development commands
├── .env.example           # Environment template
└── README.md              # This file
```

## Architecture

### Layered Design

1. **Routers** (`app/routers/`): HTTP request/response handling only
2. **Services** (`app/services/`): Pure business logic functions
3. **Repositories** (`app/repositories/`): Data access with async queries
4. **Schemas** (`app/schemas/`): Pydantic models for validation
5. **Utils** (`app/utils/`): Shared utilities

### Key Patterns

- **Async/Await**: All I/O operations are async
- **Dependency Injection**: FastAPI dependencies for session, auth
- **Repository Pattern**: Abstraction over data access
- **Cursor Pagination**: Deterministic, opaque cursors for stable pagination
- **Structured Output**: OpenAI responses validated against JSON schema

## Testing

The service supports in-memory mode for testing without a database:

```bash
# Set in .env
DB_DSN=memory://fake
```

In this mode:
- All repositories return deterministic fake data
- No database connection required
- Tests run fast and independently

## Timezone Handling

- **Storage**: All timestamps stored and served in UTC (RFC3339 format)
- **Features**: Business logic uses `Asia/Seoul` timezone when needed
- **Conversion**: Use `app.utils.time` utilities for consistent handling

## Authentication

Current implementation uses simplified bearer token parsing.

**TODO**: Implement full JWT validation with:
- Signature verification
- Expiration checking
- Scope validation
- User ID extraction

See `app/auth.py` for details.

## License

Proprietary - Internal use only

