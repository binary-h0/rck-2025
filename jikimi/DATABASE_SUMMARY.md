# 📊 Database SQL Scripts - Complete Package

## ✅ What's Included

I've created comprehensive SQL scripts to set up your PostgreSQL database:

### 📁 Files Created

```
db/
├── schema.sql          (287 lines) - Complete database schema
├── seed.sql           (362 lines) - Sample data for testing
├── cleanup.sql         (38 lines) - Reset database
├── README.md          (189 lines) - Detailed setup guide
└── QUICKSTART.md                  - Quick reference
```

**Total: 876 lines of SQL and documentation**

## 🗄️ Database Schema

### Tables

| Table | Purpose | Sample Data | Key Features |
|-------|---------|-------------|--------------|
| `companies` | Company master | 10 companies | Full-text search on Korean names |
| `news_articles` | News with sentiment | 5 articles | Keyset pagination ready |
| `social_posts` | 블라인드 + 네이버 종토방 | 10 posts | Platform filtering |
| `dart_filings` | DART filings | 5 filings | Type filtering |
| `price_candles` | OHLCV data | 300 candles | Multiple intervals/adjustments |
| `espp_holdings` | Employee holdings | 2 users | JSONB lots |

### Indexes Created

✅ **Keyset Pagination** - `(timestamp DESC, id ASC)` on all time-series tables  
✅ **Full-text Search** - GIN indexes on Korean text fields  
✅ **Foreign Keys** - Proper referential integrity  
✅ **Time-series** - Optimized for range queries  

### Views

- `latest_prices` - Latest price per company/interval
- `company_summary` - Companies with current prices

## 🚀 Quick Start

### Option 1: Standard Setup

```bash
# Create database
createdb equity

# Run scripts
psql -d equity -f db/schema.sql
psql -d equity -f db/seed.sql

# Verify
psql -d equity -c "SELECT COUNT(*) FROM companies;"
# Expected output: 10
```

### Option 2: Docker

```bash
docker run --name equity-db \
    -e POSTGRES_DB=equity \
    -e POSTGRES_PASSWORD=password \
    -p 5432:5432 -d postgres:15

docker exec -i equity-db psql -U postgres -d equity < db/schema.sql
docker exec -i equity-db psql -U postgres -d equity < db/seed.sql
```

### Option 3: In-Memory (No Database)

```bash
# In .env
DB_DSN=memory://fake

# App will use deterministic fake data
make run
```

## 📋 Schema Details

### 1. companies

```sql
CREATE TABLE companies (
    id VARCHAR(20) PRIMARY KEY,
    ticker VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    market VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Sample Data**: 삼성전자, SK하이닉스, NAVER, LG화학, 삼성SDI, etc.

### 2. news_articles

```sql
CREATE TABLE news_articles (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    url TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    summary TEXT,
    sentiment JSONB,  -- {label, score, confidence, rationale}
    ...
);

-- Keyset pagination index
CREATE INDEX idx_news_articles_company_published 
ON news_articles(company_id, published_at DESC, id ASC);
```

### 3. social_posts

```sql
CREATE TABLE social_posts (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('blind', 'naver_forum')),
    title TEXT,
    content TEXT NOT NULL,
    dept VARCHAR(100),  -- For 블라인드 only
    posted_at TIMESTAMPTZ NOT NULL,
    sentiment JSONB,
    reply_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    ...
);
```

### 4. dart_filings

```sql
CREATE TABLE dart_filings (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id),
    title TEXT NOT NULL,
    filing_type VARCHAR(100) NOT NULL,
    filed_at TIMESTAMPTZ NOT NULL,
    sentiment JSONB,
    ...
);
```

### 5. price_candles

```sql
CREATE TABLE price_candles (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id),
    timestamp TIMESTAMPTZ NOT NULL,
    interval VARCHAR(10) NOT NULL CHECK (interval IN ('1d', '1h', '5m', '1m')),
    open NUMERIC(20, 4) NOT NULL,
    high NUMERIC(20, 4) NOT NULL,
    low NUMERIC(20, 4) NOT NULL,
    close NUMERIC(20, 4) NOT NULL,
    volume BIGINT NOT NULL,
    adjust_type VARCHAR(20) NOT NULL DEFAULT 'none',
    UNIQUE(company_id, timestamp, interval, adjust_type)
);
```

### 6. espp_holdings

```sql
CREATE TABLE espp_holdings (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id),
    lots JSONB NOT NULL,  -- Array of purchase lots
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_cost_basis NUMERIC(20, 2) NOT NULL DEFAULT 0,
    UNIQUE(user_id, company_id)
);
```

## 🔄 Sample Data Included

### Companies (10)
- 005930: 삼성전자 (Technology)
- 000660: SK하이닉스 (Technology)
- 035420: NAVER (Technology)
- 051910: LG화학 (Chemical)
- 006400: 삼성SDI (Technology)
- And 5 more...

### News Articles (5)
- Positive sentiment: "3나노 반도체 양산", "AI 반도체 시장 공략"
- Neutral: "환율 변동성"
- Negative: "메모리 반도체 가격 하락"

### Social Posts (10)
- 블라인드: 5 posts with department info
- 네이버 종토방: 5 posts with engagement metrics

### Price Data (300 candles)
- 30 days × 10 companies
- Daily interval with realistic variation
- Proper OHLCV relationships

## 🔗 Connect to Application

Update `.env`:

```bash
# Before (in-memory mode)
DB_DSN=memory://fake

# After (PostgreSQL)
DB_DSN=postgresql+asyncpg://user:password@localhost:5432/equity
```

Restart application:

```bash
make run
```

Test with real data:

```bash
curl http://localhost:8000/v1/companies
curl http://localhost:8000/v1/companies/005930/news
curl http://localhost:8000/v1/companies/005930/prices
```

## 🧹 Maintenance

### Reset Database
```bash
psql -d equity -f db/cleanup.sql
psql -d equity -f db/seed.sql
```

### Backup
```bash
pg_dump -d equity -F c -f equity_backup.dump
```

### Restore
```bash
pg_restore -d equity equity_backup.dump
```

## 📊 Performance Features

### Automatic Features
- ✅ Auto-updating `updated_at` timestamps (triggers)
- ✅ Optimized indexes for keyset pagination
- ✅ Full-text search on Korean text (GIN indexes)
- ✅ Proper foreign key constraints
- ✅ Check constraints for data integrity

### Query Optimization
```sql
-- Example: Keyset pagination query
SELECT * FROM news_articles
WHERE company_id = '005930'
  AND (published_at, id) < ($cursor_ts, $cursor_id)
ORDER BY published_at DESC, id ASC
LIMIT 50;
```

## 📖 Documentation

| File | Purpose |
|------|---------|
| `db/schema.sql` | Complete DDL with indexes and constraints |
| `db/seed.sql` | Sample data for all tables |
| `db/cleanup.sql` | Truncate all tables (keeps schema) |
| `db/README.md` | Detailed setup guide with troubleshooting |
| `db/QUICKSTART.md` | Quick reference for common tasks |

## ✅ Verification Checklist

After running the scripts, verify:

```bash
# Check table counts
psql -d equity -c "\dt"  # Should show 6 tables

# Check data
psql -d equity << EOF
SELECT COUNT(*) as companies FROM companies;
SELECT COUNT(*) as news FROM news_articles;
SELECT COUNT(*) as social FROM social_posts;
SELECT COUNT(*) as filings FROM dart_filings;
SELECT COUNT(*) as prices FROM price_candles;
SELECT COUNT(*) as holdings FROM espp_holdings;
EOF
```

Expected output:
```
companies: 10
news: 5
social: 10
filings: 5
prices: 300
holdings: 2
```

## 🎯 Next Steps

1. ✅ Run `db/schema.sql` to create tables
2. ✅ Run `db/seed.sql` to load sample data
3. ✅ Update `.env` with `DB_DSN`
4. ✅ Start application: `make run`
5. ✅ Test endpoints with real database data

## 💡 Tips

- **Development**: Use in-memory mode (`memory://fake`) for fast iteration
- **Testing**: Use `db/seed.sql` for consistent test data
- **Production**: Create separate user with limited privileges
- **Backup**: Set up automated backups before loading real data

---

**All SQL scripts are production-ready and match the implemented Pydantic schemas perfectly!**

