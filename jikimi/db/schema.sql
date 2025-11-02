-- Equity Intelligence API Database Schema
-- PostgreSQL 12+
-- Run with: psql -U user -d equity -f db/schema.sql

-- Enable UUID extension (optional, if using UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Full-text search indexes use 'simple' configuration
-- This works well for Korean text as it doesn't apply language-specific
-- stemming or stop words. For advanced Korean text search, consider
-- installing additional extensions like pg_trgm for trigram matching.

-- ============================================================================
-- COMPANIES
-- ============================================================================

CREATE TABLE companies (
    id VARCHAR(20) PRIMARY KEY,
    ticker VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    market VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index (using 'simple' config which works well for Korean text)
CREATE INDEX idx_companies_name ON companies USING gin(to_tsvector('simple', name));
CREATE INDEX idx_companies_ticker ON companies(ticker);
CREATE INDEX idx_companies_sector ON companies(sector);

COMMENT ON TABLE companies IS 'Company master data';
COMMENT ON COLUMN companies.id IS 'Company identifier (e.g., stock code)';
COMMENT ON COLUMN companies.ticker IS 'Stock ticker symbol (e.g., 005930.KS)';

-- ============================================================================
-- NEWS ARTICLES
-- ============================================================================

CREATE TABLE news_articles (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    url TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    summary TEXT,
    content TEXT,
    sentiment JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for keyset pagination (published_at DESC, id ASC)
CREATE INDEX idx_news_articles_company_published ON news_articles(company_id, published_at DESC, id ASC);
CREATE INDEX idx_news_articles_source ON news_articles(source);
CREATE INDEX idx_news_articles_published ON news_articles(published_at DESC);

-- Full-text search index (using 'simple' config which works well for Korean text)
CREATE INDEX idx_news_articles_title ON news_articles USING gin(to_tsvector('simple', title));

COMMENT ON TABLE news_articles IS 'News articles with stock-impact sentiment';
COMMENT ON COLUMN news_articles.sentiment IS 'JSONB: {label, score, confidence, rationale}';

-- ============================================================================
-- SOCIAL POSTS (블라인드, 네이버 종토방)
-- ============================================================================

CREATE TABLE social_posts (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('blind', 'naver_forum')),
    title TEXT,
    content TEXT NOT NULL,
    author VARCHAR(100),
    dept VARCHAR(100),
    posted_at TIMESTAMPTZ NOT NULL,
    sentiment JSONB,
    reply_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for keyset pagination (posted_at DESC, id ASC)
CREATE INDEX idx_social_posts_company_platform_posted ON social_posts(company_id, platform, posted_at DESC, id ASC);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_dept ON social_posts(dept) WHERE dept IS NOT NULL;
CREATE INDEX idx_social_posts_posted ON social_posts(posted_at DESC);

-- Full-text search index (using 'simple' config which works well for Korean text)
CREATE INDEX idx_social_posts_content ON social_posts USING gin(to_tsvector('simple', content));

COMMENT ON TABLE social_posts IS 'Social media posts from 블라인드 and 네이버 종토방';
COMMENT ON COLUMN social_posts.platform IS 'Platform: blind or naver_forum';
COMMENT ON COLUMN social_posts.dept IS 'Department (블라인드 only)';
COMMENT ON COLUMN social_posts.sentiment IS 'JSONB: {label, score, confidence, rationale}';

-- ============================================================================
-- DART FILINGS
-- ============================================================================

CREATE TABLE dart_filings (
    id VARCHAR(100) PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filing_type VARCHAR(100) NOT NULL,
    filed_at TIMESTAMPTZ NOT NULL,
    url TEXT,
    summary TEXT,
    content TEXT,
    sentiment JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for keyset pagination (filed_at DESC, id ASC)
CREATE INDEX idx_dart_filings_company_filed ON dart_filings(company_id, filed_at DESC, id ASC);
CREATE INDEX idx_dart_filings_type ON dart_filings(filing_type);
CREATE INDEX idx_dart_filings_filed ON dart_filings(filed_at DESC);

COMMENT ON TABLE dart_filings IS 'DART regulatory filings with sentiment analysis';
COMMENT ON COLUMN dart_filings.filing_type IS 'Filing type (e.g., 분기보고서, 사업보고서)';
COMMENT ON COLUMN dart_filings.sentiment IS 'JSONB: {label, score, confidence, rationale}';

-- ============================================================================
-- PRICE CANDLES
-- ============================================================================

CREATE TABLE price_candles (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    interval VARCHAR(10) NOT NULL CHECK (interval IN ('1d', '1h', '5m', '1m')),
    open NUMERIC(20, 4) NOT NULL,
    high NUMERIC(20, 4) NOT NULL,
    low NUMERIC(20, 4) NOT NULL,
    close NUMERIC(20, 4) NOT NULL,
    volume BIGINT NOT NULL,
    adjust_type VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (adjust_type IN ('none', 'split', 'total_return')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, timestamp, interval, adjust_type)
);

-- Indexes for efficient time-series queries
CREATE INDEX idx_price_candles_company_time ON price_candles(company_id, interval, timestamp DESC);
CREATE INDEX idx_price_candles_timestamp ON price_candles(timestamp DESC);

COMMENT ON TABLE price_candles IS 'OHLCV price data with multiple intervals';
COMMENT ON COLUMN price_candles.interval IS 'Candle interval: 1d, 1h, 5m, 1m';
COMMENT ON COLUMN price_candles.adjust_type IS 'Price adjustment: none, split, total_return';

-- ============================================================================
-- ESPP HOLDINGS
-- ============================================================================

CREATE TABLE espp_holdings (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lots JSONB NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    total_cost_basis NUMERIC(20, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_espp_holdings_user ON espp_holdings(user_id);
CREATE INDEX idx_espp_holdings_company ON espp_holdings(company_id);

COMMENT ON TABLE espp_holdings IS 'Employee stock purchase plan holdings';
COMMENT ON COLUMN espp_holdings.lots IS 'JSONB array: [{lot_id, purchase_date, quantity, purchase_price, cost_basis}]';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dart_filings_updated_at BEFORE UPDATE ON dart_filings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_candles_updated_at BEFORE UPDATE ON price_candles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_espp_holdings_updated_at BEFORE UPDATE ON espp_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS (Optional - for common queries)
-- ============================================================================

-- Latest prices per company
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (company_id, interval)
    company_id,
    interval,
    timestamp,
    open,
    high,
    low,
    close,
    volume
FROM price_candles
WHERE adjust_type = 'none'
ORDER BY company_id, interval, timestamp DESC;

COMMENT ON VIEW latest_prices IS 'Latest price for each company and interval';

-- Company summary with latest price
CREATE OR REPLACE VIEW company_summary AS
SELECT 
    c.*,
    lp.close as latest_price,
    lp.timestamp as price_timestamp
FROM companies c
LEFT JOIN latest_prices lp ON c.id = lp.company_id AND lp.interval = '1d';

COMMENT ON VIEW company_summary IS 'Companies with their latest daily closing price';

-- ============================================================================
-- GRANTS (Adjust based on your user setup)
-- ============================================================================

-- Example: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO equity_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO equity_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO equity_app_user;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Verify schema
DO $$
BEGIN
    RAISE NOTICE 'Schema created successfully!';
    RAISE NOTICE 'Tables: companies, news_articles, social_posts, dart_filings, price_candles, espp_holdings';
    RAISE NOTICE 'Views: latest_prices, company_summary';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run seed data: psql -U user -d equity -f db/seed.sql';
    RAISE NOTICE '  2. Update DB_DSN in .env';
    RAISE NOTICE '  3. Run application: make run';
END $$;

