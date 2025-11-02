# SQL Implementation Complete

## ✅ What Was Implemented

I've fully implemented **production-ready SQL queries** for all repository layers using SQLAlchemy 2.x async.

### 📦 New Files Created

**`app/models.py`** - Complete SQLAlchemy 2.x models:
- `CompanyModel`
- `NewsArticleModel`
- `SocialPostModel`
- `DartFilingModel`
- `PriceCandleModel`
- `EsppHoldingModel`

All models use:
- ✅ SQLAlchemy 2.x declarative mapping with `Mapped[]` types
- ✅ Proper constraints (CHECK, UNIQUE, FK)
- ✅ JSONB for sentiment and lots data
- ✅ Timezone-aware timestamps

### 🔄 Updated Repository Files

All 6 repositories now have **complete SQL implementations**:

#### 1. **`companies_repo.py`**
- ✅ `search_companies()` - Full-text search with ILIKE on name/ticker/id
- ✅ `get_company()` - Simple lookup by ID
- Uses offset pagination (companies don't have timestamps)

#### 2. **`news_repo.py`**
- ✅ `fetch_news()` - **Keyset pagination** on `(published_at DESC, id ASC)`
- ✅ Time range filtering (start/end)
- ✅ Source filtering (multi-select)
- ✅ Sentiment parsing from JSONB

#### 3. **`social_repo.py`**
- ✅ `fetch_social()` - **Keyset pagination** on `(posted_at DESC, id ASC)`
- ✅ Platform filtering (blind/naver_forum)
- ✅ Department filtering (블라인드 only)
- ✅ Time range filtering

#### 4. **`dart_repo.py`**
- ✅ `fetch_filings()` - **Keyset pagination** on `(filed_at DESC, id ASC)`
- ✅ Filing type filtering
- ✅ Time range filtering

#### 5. **`prices_repo.py`**
- ✅ `fetch_prices()` - Time-series queries with interval/adjust filters
- ✅ Proper OHLCV conversion to float
- ✅ Ticker lookup join
- ✅ Ordered by timestamp ASC for charts

#### 6. **`holdings_repo.py`**
- ✅ `load_espp_holdings()` - JSONB lots parsing
- ✅ Ticker lookup join
- ✅ DateTime parsing from JSONB
- ✅ Proper type conversions

### 🎯 Key Features

#### Keyset Pagination (News, Social, Filings)
```python
# Cursor structure: {"published_at": "2025-11-02T10:00:00Z", "id": "article_123"}
# SQL WHERE clause:
# WHERE (published_at < cursor_ts) OR (published_at = cursor_ts AND id > cursor_id)
# ORDER BY published_at DESC, id ASC
```

This provides:
- ✅ **Stable pagination** - no duplicate/missing items
- ✅ **Efficient** - uses indexes `(timestamp DESC, id ASC)`
- ✅ **Deterministic** - consistent ordering

#### Time Range Filtering
All time-series queries support:
- `start` (inclusive) - `WHERE timestamp >= start`
- `end` (exclusive) - `WHERE timestamp < end`

#### JSONB Handling
- **Sentiment**: `JSONB -> Sentiment(**row.sentiment)`
- **ESPP Lots**: `JSONB array -> List[EsppLot]`

### 🔄 Dual Mode Operation

Each repository **automatically switches** between:

1. **SQL Mode** (default) - When `DB_DSN` is PostgreSQL
   ```python
   # Uses actual SQLAlchemy queries
   query = select(CompanyModel).where(...)
   ```

2. **Memory Mode** (testing) - When `DB_DSN=memory://fake`
   ```python
   # Returns deterministic fake data
   return await self._fetch_news_memory(...)
   ```

Controlled by `self.is_memory_mode()` check.

### 📊 Query Examples

#### Search Companies
```python
# SQL generated:
SELECT * FROM companies
WHERE name ILIKE '%삼성%' OR ticker ILIKE '%삼성%' OR id ILIKE '%삼성%'
ORDER BY id
LIMIT 51 OFFSET 0
```

#### Fetch News with Keyset
```python
# SQL generated:
SELECT * FROM news_articles
WHERE company_id = '005930'
  AND (published_at < '2025-11-02T10:00:00Z'
       OR (published_at = '2025-11-02T10:00:00Z' AND id > 'article_5'))
ORDER BY published_at DESC, id ASC
LIMIT 51
```

#### Fetch Prices
```python
# SQL generated:
SELECT * FROM price_candles
WHERE company_id = '005930'
  AND interval = '1d'
  AND adjust_type = 'split'
  AND timestamp >= '2025-10-01T00:00:00Z'
  AND timestamp < '2025-11-01T00:00:00Z'
ORDER BY timestamp ASC
```

### 🚀 Ready to Use

Now you can run the application with **real PostgreSQL data**:

```bash
# 1. Setup database
createdb equity
psql -d equity -f db/schema.sql
psql -d equity -f db/seed.sql

# 2. Update .env
DB_DSN=postgresql+asyncpg://user:password@localhost:5432/equity

# 3. Run application
make run

# 4. Test with real data
curl http://localhost:8000/v1/companies
curl http://localhost:8000/v1/companies/030200  # KT!
curl http://localhost:8000/v1/companies/030200/news
curl http://localhost:8000/v1/companies/030200/prices?interval=1d
```

### 📝 Testing Both Modes

```bash
# Test with SQL (real database)
DB_DSN=postgresql+asyncpg://user:password@localhost:5432/equity make run

# Test with memory (no database)
DB_DSN=memory://fake make run

# Both modes work identically from API perspective!
```

### ✨ Benefits

1. **Type Safe** - Full mypy compliance with SQLAlchemy 2.x types
2. **Efficient** - Proper indexes used for all queries
3. **Scalable** - Keyset pagination handles millions of rows
4. **Testable** - In-memory mode for fast tests
5. **Production Ready** - No manual SQL strings, all parameterized

### 🎯 What Changed

**Before:**
```python
# TODO: Implement SQL query
return [], None
```

**After:**
```python
query = select(NewsArticleModel).where(
    NewsArticleModel.company_id == company_id
)
# ... full keyset pagination implementation
result = await self.session.execute(query)
return articles, next_cursor
```

All repositories are now **fully functional** with real PostgreSQL! 🎉

