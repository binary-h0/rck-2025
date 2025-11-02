-- Seed data for Equity Intelligence API
-- Run after schema.sql: psql -U user -d equity -f db/seed.sql

-- ============================================================================
-- COMPANIES
-- ============================================================================

INSERT INTO companies (id, ticker, name, sector, market) VALUES
('005930', '005930.KS', '삼성전자', 'Technology', 'KOSPI'),
('000660', '000660.KS', 'SK하이닉스', 'Technology', 'KOSPI'),
('035420', '035420.KS', 'NAVER', 'Technology', 'KOSPI'),
('030200', '030200.KS', 'KT', 'Telecommunications', 'KOSPI'),
('051910', '051910.KS', 'LG화학', 'Chemical', 'KOSPI'),
('006400', '006400.KS', '삼성SDI', 'Technology', 'KOSPI'),
('005380', '005380.KS', '현대자동차', 'Automotive', 'KOSPI'),
('000270', '000270.KS', '기아', 'Automotive', 'KOSPI'),
('068270', '068270.KS', '셀트리온', 'Healthcare', 'KOSPI'),
('207940', '207940.KS', '삼성바이오로직스', 'Healthcare', 'KOSPI'),
('005490', '005490.KS', 'POSCO홀딩스', 'Steel', 'KOSPI')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NEWS ARTICLES (Sample data for 삼성전자)
-- ============================================================================

INSERT INTO news_articles (id, company_id, title, source, url, published_at, summary, sentiment) VALUES
('news_001', '005930', '삼성전자, 3나노 반도체 양산 본격화', '한국경제', 'https://example.com/news/1', NOW() - INTERVAL '1 hour', '삼성전자가 3나노 공정 반도체 양산을 본격화한다고 발표했습니다.', '{"label": "positive", "score": 0.8, "confidence": 0.9, "rationale": "Advanced chip production indicates strong technological competitiveness"}'::jsonb),
('news_002', '005930', '반도체 업황 개선 전망, 삼성전자 수혜 기대', '매일경제', 'https://example.com/news/2', NOW() - INTERVAL '3 hours', '글로벌 반도체 업황이 개선되면서 삼성전자의 실적 회복이 기대됩니다.', '{"label": "positive", "score": 0.7, "confidence": 0.85}'::jsonb),
('news_003', '005930', '삼성전자, AI 반도체 시장 공략 강화', '서울경제', 'https://example.com/news/3', NOW() - INTERVAL '6 hours', 'AI 반도체 수요 증가에 대응해 관련 제품 라인업을 강화합니다.', '{"label": "positive", "score": 0.75, "confidence": 0.88}'::jsonb),
('news_004', '005930', '환율 변동성 확대, 수출 기업 영향 주목', '연합뉴스', 'https://example.com/news/4', NOW() - INTERVAL '1 day', '최근 환율 변동성이 확대되면서 수출 기업들의 실적에 영향이 예상됩니다.', '{"label": "neutral", "score": 0.0, "confidence": 0.75}'::jsonb),
('news_005', '005930', '메모리 반도체 가격 하락세 지속', '파이낸셜뉴스', 'https://example.com/news/5', NOW() - INTERVAL '2 days', 'D램과 낸드 플래시 가격이 계속 하락하고 있습니다.', '{"label": "negative", "score": -0.5, "confidence": 0.8}'::jsonb),
('news_006', '030200', 'KT, AI 데이터센터 구축 투자 확대', '전자신문', 'https://example.com/news/6', NOW() - INTERVAL '2 hours', 'KT가 AI 서비스 확대를 위해 대규모 데이터센터 투자를 발표했습니다.', '{"label": "positive", "score": 0.7, "confidence": 0.85}'::jsonb),
('news_007', '030200', 'KT, 5G 가입자 1000만 돌파', '디지털타임스', 'https://example.com/news/7', NOW() - INTERVAL '5 hours', '5G 가입자가 1000만 명을 넘어서며 통신 시장 점유율 확대에 성공했습니다.', '{"label": "positive", "score": 0.65, "confidence": 0.8}'::jsonb),
('news_008', '030200', 'KT, 클라우드 사업 성장세 지속', '서울경제', 'https://example.com/news/8', NOW() - INTERVAL '1 day', '클라우드 서비스 매출이 전년 대비 30% 이상 증가하며 신성장동력으로 자리잡고 있습니다.', '{"label": "positive", "score": 0.6, "confidence": 0.82}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SOCIAL POSTS - 블라인드
-- ============================================================================

INSERT INTO social_posts (id, company_id, platform, title, content, author, dept, posted_at, sentiment, reply_count, like_count) VALUES
('blind_001', '005930', 'blind', '올해 성과급 기대해도 될까요?', '실적이 개선되고 있다는 뉴스가 나오는데 성과급도 좋을까요?', '익명_사원', '경영지원', NOW() - INTERVAL '2 hours', '{"label": "positive", "score": 0.4, "confidence": 0.65}'::jsonb, 23, 45),
('blind_002', '005930', 'blind', '신규 프로젝트 투자 확대', '회사에서 AI 관련 프로젝트에 대규모 투자한다는 소식 들었어요', '익명_개발자', 'IT개발', NOW() - INTERVAL '5 hours', '{"label": "positive", "score": 0.6, "confidence": 0.7}'::jsonb, 12, 28),
('blind_003', '005930', 'blind', '주가 전망 어떻게 보시나요?', '최근 주가가 많이 올랐는데 더 오를 여지가 있을까요?', '익명_직원', '재무', NOW() - INTERVAL '8 hours', '{"label": "neutral", "score": 0.1, "confidence": 0.6}'::jsonb, 34, 56),
('blind_004', '005930', 'blind', '경쟁사 대비 우위 유지 중', '기술력은 여전히 우리가 앞서고 있는 것 같습니다', '익명_연구원', '연구개발', NOW() - INTERVAL '1 day', '{"label": "positive", "score": 0.7, "confidence": 0.75}'::jsonb, 18, 42),
('blind_005', '005930', 'blind', '구조조정 소문', '일부 부서에서 구조조정 얘기가 나온다는데 사실인가요?', '익명_사원', '경영지원', NOW() - INTERVAL '1 day', '{"label": "negative", "score": -0.4, "confidence": 0.6}'::jsonb, 67, 89),
('blind_006', '030200', 'blind', 'AI 사업부 분위기 좋네요', 'AI 데이터센터 투자 발표 이후 분위기가 많이 좋아졌어요', '익명_엔지니어', 'ICT기술', NOW() - INTERVAL '3 hours', '{"label": "positive", "score": 0.65, "confidence": 0.7}'::jsonb, 19, 38),
('blind_007', '030200', 'blind', '통신 시장 경쟁 심화', 'SKT, LGU+와 경쟁이 더 치열해지고 있는데 괜찮을까요?', '익명_직원', '마케팅', NOW() - INTERVAL '6 hours', '{"label": "neutral", "score": -0.1, "confidence": 0.6}'::jsonb, 28, 44)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SOCIAL POSTS - 네이버 종토방
-- ============================================================================

INSERT INTO social_posts (id, company_id, platform, title, content, author, posted_at, sentiment, reply_count, like_count) VALUES
('naver_001', '005930', 'naver_forum', '삼성전자 매수 타이밍?', '지금 매수해도 될까요? 아니면 더 기다려야 할까요?', 'user_123', NOW() - INTERVAL '3 hours', '{"label": "neutral", "score": 0.0, "confidence": 0.5}'::jsonb, 45, 23),
('naver_002', '005930', 'naver_forum', '목표가 상향 조정', '증권사들이 목표가를 올리고 있네요. 상승 여력이 있어 보입니다.', 'investor_456', NOW() - INTERVAL '6 hours', '{"label": "positive", "score": 0.6, "confidence": 0.7}'::jsonb, 28, 56),
('naver_003', '005930', 'naver_forum', 'AI 수요 덕분에 실적 개선', 'AI 반도체 수요가 폭발적으로 늘어나면서 실적이 좋아지고 있습니다', 'tech_investor', NOW() - INTERVAL '12 hours', '{"label": "positive", "score": 0.8, "confidence": 0.85}'::jsonb, 34, 78),
('naver_004', '005930', 'naver_forum', '배당 수익률 체크', '배당 수익률이 괜찮은 편인가요?', 'dividend_lover', NOW() - INTERVAL '1 day', '{"label": "neutral", "score": 0.1, "confidence": 0.6}'::jsonb, 19, 32),
('naver_005', '005930', 'naver_forum', '장기 보유 관점에서 매력적', '단기 변동성은 있지만 장기적으로 보면 좋은 투자처입니다', 'long_term_holder', NOW() - INTERVAL '2 days', '{"label": "positive", "score": 0.7, "confidence": 0.8}'::jsonb, 41, 94),
('naver_006', '030200', 'naver_forum', 'KT 배당주로 괜찮나요?', '안정적인 배당 수익을 노리고 있는데 KT 어떤가요?', 'dividend_seeker', NOW() - INTERVAL '4 hours', '{"label": "positive", "score": 0.5, "confidence": 0.7}'::jsonb, 32, 51),
('naver_007', '030200', 'naver_forum', 'AI 데이터센터 투자 호재', 'AI 데이터센터 투자가 장기적으로 좋은 호재가 될 것 같습니다', 'kt_investor', NOW() - INTERVAL '10 hours', '{"label": "positive", "score": 0.7, "confidence": 0.75}'::jsonb, 26, 62),
('naver_008', '030200', 'naver_forum', '통신주 전반적으로 약세', '요즘 통신주들이 전체적으로 힘을 못 쓰고 있네요', 'market_watcher', NOW() - INTERVAL '1 day', '{"label": "negative", "score": -0.3, "confidence": 0.65}'::jsonb, 41, 38)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DART FILINGS
-- ============================================================================

INSERT INTO dart_filings (id, company_id, title, filing_type, filed_at, url, summary, sentiment) VALUES
('filing_001', '005930', '분기보고서 (2025.09)', '분기보고서', NOW() - INTERVAL '7 days', 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250001', '2025년 3분기 실적 보고', '{"label": "neutral", "score": 0.0, "confidence": 0.8}'::jsonb),
('filing_002', '005930', '주요사항보고서(투자판단관련주요경영사항)', '주요사항보고', NOW() - INTERVAL '14 days', 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250002', '신규 반도체 라인 투자 결정', '{"label": "positive", "score": 0.7, "confidence": 0.85}'::jsonb),
('filing_003', '005930', '매출액 또는 손익구조 30%(대규모법인은 15%)이상 변경', '주요사항보고', NOW() - INTERVAL '21 days', 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250003', '실적 개선으로 손익 구조 개선', '{"label": "positive", "score": 0.6, "confidence": 0.8}'::jsonb),
('filing_004', '005930', '타법인 주식 및 출자증권 취득결정', '주요사항보고', NOW() - INTERVAL '30 days', 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250004', 'AI 스타트업 지분 투자', '{"label": "positive", "score": 0.5, "confidence": 0.75}'::jsonb),
('filing_005', '005930', '감사보고서 제출', '감사보고서', NOW() - INTERVAL '60 days', 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250005', '2024년 회계연도 감사 보고', '{"label": "neutral", "score": 0.0, "confidence": 0.9}'::jsonb),
('filing_006', '030200', '분기보고서 (2025.09)', '분기보고서', NOW() - INTERVAL '10 days', 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250006', 'KT 2025년 3분기 실적 보고', '{"label": "neutral", "score": 0.0, "confidence": 0.8}'::jsonb),
('filing_007', '030200', '주요사항보고서(자산양수도)', '주요사항보고', NOW() - INTERVAL '20 days', 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20250007', 'AI 데이터센터 인수 결정', '{"label": "positive", "score": 0.65, "confidence": 0.82}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PRICE CANDLES (Daily data for past 30 days)
-- ============================================================================

DO $$
DECLARE
    company_rec RECORD;
    day_offset INTEGER;
    base_price NUMERIC;
    daily_price NUMERIC;
    daily_open NUMERIC;
    daily_high NUMERIC;
    daily_low NUMERIC;
    daily_close NUMERIC;
    daily_volume BIGINT;
BEGIN
    -- Generate price data for each company
    FOR company_rec IN SELECT id FROM companies LOOP
        -- Set base price based on company
        CASE company_rec.id
            WHEN '005930' THEN base_price := 75000;
            WHEN '000660' THEN base_price := 125000;
            WHEN '035420' THEN base_price := 180000;
            WHEN '030200' THEN base_price := 35000;
            WHEN '051910' THEN base_price := 450000;
            WHEN '006400' THEN base_price := 320000;
            ELSE base_price := 50000;
        END CASE;
        
        -- Generate 30 days of price data
        FOR day_offset IN 0..29 LOOP
            daily_price := base_price + (random() * 10000 - 5000);
            daily_open := daily_price + (random() * 2000 - 1000);
            daily_high := GREATEST(daily_open, daily_price) + (random() * 1000);
            daily_low := LEAST(daily_open, daily_price) - (random() * 1000);
            daily_close := daily_price;
            daily_volume := 10000000 + (random() * 10000000)::BIGINT;
            
            INSERT INTO price_candles (
                company_id, timestamp, interval, open, high, low, close, volume, adjust_type
            ) VALUES (
                company_rec.id,
                (NOW() - (day_offset || ' days')::INTERVAL)::DATE,
                '1d',
                daily_open,
                daily_high,
                daily_low,
                daily_close,
                daily_volume,
                'none'
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Generated price data for % companies', (SELECT COUNT(*) FROM companies);
END $$;

-- ============================================================================
-- ESPP HOLDINGS
-- ============================================================================

INSERT INTO espp_holdings (user_id, company_id, lots, total_quantity, total_cost_basis) VALUES
(
    'user_123',
    '005930',
    '[
        {
            "lot_id": "lot_2024_q1",
            "purchase_date": "2024-03-15T00:00:00Z",
            "quantity": 100,
            "purchase_price": 70000.0,
            "cost_basis": 7000000.0
        },
        {
            "lot_id": "lot_2024_q2",
            "purchase_date": "2024-06-15T00:00:00Z",
            "quantity": 150,
            "purchase_price": 70000.0,
            "cost_basis": 10500000.0
        },
        {
            "lot_id": "lot_2024_q3",
            "purchase_date": "2024-09-15T00:00:00Z",
            "quantity": 80,
            "purchase_price": 73000.0,
            "cost_basis": 5840000.0
        }
    ]'::jsonb,
    330,
    23340000.0
),
(
    'user_456',
    '000660',
    '[
        {
            "lot_id": "lot_2024_q2",
            "purchase_date": "2024-06-15T00:00:00Z",
            "quantity": 50,
            "purchase_price": 120000.0,
            "cost_basis": 6000000.0
        }
    ]'::jsonb,
    50,
    6000000.0
)
ON CONFLICT (user_id, company_id) DO NOTHING;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
DECLARE
    company_count INTEGER;
    news_count INTEGER;
    social_count INTEGER;
    filing_count INTEGER;
    price_count INTEGER;
    holding_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO news_count FROM news_articles;
    SELECT COUNT(*) INTO social_count FROM social_posts;
    SELECT COUNT(*) INTO filing_count FROM dart_filings;
    SELECT COUNT(*) INTO price_count FROM price_candles;
    SELECT COUNT(*) INTO holding_count FROM espp_holdings;
    
    RAISE NOTICE '=== Seed Data Summary ===';
    RAISE NOTICE 'Companies: %', company_count;
    RAISE NOTICE 'News Articles: %', news_count;
    RAISE NOTICE 'Social Posts: %', social_count;
    RAISE NOTICE 'DART Filings: %', filing_count;
    RAISE NOTICE 'Price Candles: %', price_count;
    RAISE NOTICE 'ESPP Holdings: %', holding_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Database is ready! Update your .env file:';
    RAISE NOTICE 'DB_DSN=postgresql+asyncpg://user:password@localhost:5432/equity';
END $$;

