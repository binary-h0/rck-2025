# Database Setup Guide

## Prerequisites

- PostgreSQL 12 or higher
- psql command-line tool
- Database user with CREATE privileges

## Quick Setup

### 1. Create Database

```bash
# Create database
createdb equity

# Or using psql
psql -U postgres -c "CREATE DATABASE equity;"
```

### 2. Create Application User (Optional but Recommended)

```bash
psql -U postgres -d equity
```

```sql
-- Create application user
CREATE USER equity_app WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT CONNECT ON DATABASE equity TO equity_app;
GRANT CREATE ON SCHEMA public TO equity_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO equity_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO equity_app;
```

### 3. Run Schema Script

```bash
# Run schema creation
psql -U equity_app -d equity -f db/schema.sql

# Or with postgres user
psql -U postgres -d equity -f db/schema.sql
```

### 4. Load Seed Data

```bash
# Load seed data
psql -U equity_app -d equity -f db/seed.sql
```

### 5. Verify Setup

```bash
psql -U equity_app -d equity
```

```sql
-- Check tables
\dt

-- Check data
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM news_articles;
SELECT COUNT(*) FROM social_posts;
SELECT COUNT(*) FROM dart_filings;
SELECT COUNT(*) FROM price_candles;
SELECT COUNT(*) FROM espp_holdings;

-- View sample company
SELECT * FROM companies WHERE id = '005930';

-- View latest prices
SELECT * FROM latest_prices WHERE company_id = '005930';
```

## Database Schema Overview

### Tables

| Table | Description | Key Indexes |
|-------|-------------|-------------|
| `companies` | Company master data | `id` (PK), `ticker`, `name` (gin) |
| `news_articles` | News with sentiment | `(company_id, published_at DESC, id ASC)` |
| `social_posts` | 블라인드, 네이버 종토방 | `(company_id, platform, posted_at DESC, id ASC)` |
| `dart_filings` | DART filings | `(company_id, filed_at DESC, id ASC)` |
| `price_candles` | OHLCV price data | `(company_id, interval, timestamp DESC)` |
| `espp_holdings` | Employee holdings | `(user_id, company_id)` UNIQUE |

### Views

| View | Description |
|------|-------------|
| `latest_prices` | Latest price for each company/interval |
| `company_summary` | Companies with latest daily price |

## Update Application Configuration

Edit `.env` file:

```bash
# Update from memory mode to PostgreSQL
DB_DSN=postgresql+asyncpg://equity_app:your_secure_password@localhost:5432/equity
```

## Connection String Formats

### For psycopg2 (synchronous)
```
postgresql://user:password@localhost:5432/equity
```

### For asyncpg (async - used by this app)
```
postgresql+asyncpg://user:password@localhost:5432/equity
```

### For remote connection
```
postgresql+asyncpg://user:password@remote-host:5432/equity
```

## Maintenance Commands

### Backup Database

```bash
# Full backup
pg_dump -U equity_app -d equity -F c -f equity_backup.dump

# Schema only
pg_dump -U equity_app -d equity -s -f equity_schema.sql

# Data only
pg_dump -U equity_app -d equity -a -f equity_data.sql
```

### Restore Database

```bash
# From custom format
pg_restore -U equity_app -d equity equity_backup.dump

# From SQL file
psql -U equity_app -d equity -f equity_backup.sql
```

### Reset Database

```bash
# Drop and recreate
dropdb equity
createdb equity
psql -U equity_app -d equity -f db/schema.sql
psql -U equity_app -d equity -f db/seed.sql
```

## Indexing Strategy

The schema includes indexes optimized for:

1. **Keyset Pagination**: `(timestamp DESC, id ASC)` for deterministic ordering
2. **Full-text Search**: GIN indexes on Korean text fields
3. **Foreign Keys**: Automatic indexes on FK columns
4. **Time-series Queries**: Optimized for range scans on timestamps

## Performance Tips

### Analyze Tables

```sql
ANALYZE companies;
ANALYZE news_articles;
ANALYZE social_posts;
ANALYZE dart_filings;
ANALYZE price_candles;
```

### Check Index Usage

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Monitor Slow Queries

```sql
-- Enable query logging in postgresql.conf
log_min_duration_statement = 1000  # Log queries > 1s

-- View slow queries
SELECT 
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Security Recommendations

1. **Use strong passwords** for database users
2. **Limit network access** using `pg_hba.conf`
3. **Use SSL/TLS** for remote connections
4. **Regular backups** with encryption
5. **Separate users** for application and admin tasks

## Troubleshooting

### Connection refused
```bash
# Check PostgreSQL is running
pg_isready

# Check if listening on correct port
netstat -an | grep 5432
```

### Permission denied
```sql
-- Grant missing permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO equity_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO equity_app;
```

### Schema already exists
```bash
# Drop existing schema
psql -U postgres -d equity -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then re-run schema.sql
```

## Docker Setup (Optional)

```bash
# Run PostgreSQL in Docker
docker run --name equity-db \
    -e POSTGRES_DB=equity \
    -e POSTGRES_USER=equity_app \
    -e POSTGRES_PASSWORD=your_secure_password \
    -p 5432:5432 \
    -v equity_data:/var/lib/postgresql/data \
    -d postgres:15

# Wait for startup
sleep 5

# Run schema
docker exec -i equity-db psql -U equity_app -d equity < db/schema.sql

# Run seed data
docker exec -i equity-db psql -U equity_app -d equity < db/seed.sql
```

## Next Steps

After database setup:

1. Update `.env` with correct `DB_DSN`
2. Start the application: `make run`
3. Test endpoints: `curl http://localhost:8000/healthz`
4. Check data: `curl http://localhost:8000/v1/companies`

For production deployment, consider:
- Connection pooling (already configured in SQLAlchemy)
- Read replicas for scaling
- Regular vacuum and analyze
- Monitoring with pg_stat_statements
- Backup automation

