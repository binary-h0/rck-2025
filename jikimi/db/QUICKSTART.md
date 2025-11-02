# Database Setup - Quick Reference

## 📋 Prerequisites

- PostgreSQL 12+
- psql CLI tool

## 🚀 Quick Setup (3 steps)

```bash
# 1. Create database
createdb equity

# 2. Create schema and indexes
psql -d equity -f db/schema.sql

# 3. Load sample data
psql -d equity -f db/seed.sql
```

## 🔍 Verify Installation

```bash
psql -d equity -c "SELECT COUNT(*) FROM companies;"
# Expected: 10

psql -d equity -c "SELECT COUNT(*) FROM price_candles;"
# Expected: 300 (30 days × 10 companies)
```

## 📊 What's Included

### Tables Created
- ✅ `companies` - 10 Korean companies (삼성전자, SK하이닉스, NAVER, etc.)
- ✅ `news_articles` - 5 sample news articles with sentiment
- ✅ `social_posts` - 10 posts (5 블라인드 + 5 네이버 종토방)
- ✅ `dart_filings` - 5 sample DART filings
- ✅ `price_candles` - 30 days of daily OHLCV data for each company
- ✅ `espp_holdings` - 2 sample user holdings

### Indexes for Performance
- Keyset pagination: `(timestamp DESC, id ASC)`
- Full-text search: GIN indexes on Korean text
- Time-series queries: Optimized for range scans

## 🔗 Connect Application

Update `.env`:

```bash
DB_DSN=postgresql+asyncpg://your_user:password@localhost:5432/equity
```

Then start the app:

```bash
make run
```

## 📖 Full Documentation

See `db/README.md` for:
- User creation
- Permissions setup
- Backup/restore
- Performance tuning
- Docker setup
- Troubleshooting

## 🧹 Reset Database

```bash
psql -d equity -f db/cleanup.sql
psql -d equity -f db/seed.sql
```

## 🐳 Docker Option

```bash
docker run --name equity-db \
    -e POSTGRES_DB=equity \
    -e POSTGRES_PASSWORD=password \
    -p 5432:5432 \
    -d postgres:15

sleep 5

docker exec -i equity-db psql -U postgres -d equity < db/schema.sql
docker exec -i equity-db psql -U postgres -d equity < db/seed.sql
```

