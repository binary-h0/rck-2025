-- Cleanup script for development/testing
-- WARNING: This will delete ALL data from the database!
-- Use with caution, especially in production environments

BEGIN;

-- Disable triggers temporarily
SET session_replication_role = replica;

-- Truncate all tables (keeps schema, removes data)
TRUNCATE TABLE espp_holdings CASCADE;
TRUNCATE TABLE price_candles CASCADE;
TRUNCATE TABLE dart_filings CASCADE;
TRUNCATE TABLE social_posts CASCADE;
TRUNCATE TABLE news_articles CASCADE;
TRUNCATE TABLE companies CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset sequences
ALTER SEQUENCE price_candles_id_seq RESTART WITH 1;
ALTER SEQUENCE espp_holdings_id_seq RESTART WITH 1;

COMMIT;

-- Verify cleanup
DO $$
BEGIN
    RAISE NOTICE '=== Cleanup Complete ===';
    RAISE NOTICE 'All data has been removed from tables';
    RAISE NOTICE 'Schema and indexes are intact';
    RAISE NOTICE 'Run db/seed.sql to reload sample data';
END $$;

