#!/bin/bash
set -e

# Test script for intelligence creation endpoints
# This script demonstrates creating news articles, social posts, and DART filings
# with automatic sentiment analysis

BASE_URL="${BASE_URL:-http://localhost:8000/v1}"
COMPANY_ID="${COMPANY_ID:-005930}"

echo "Testing Intelligence Creation API"
echo "=================================="
echo "Base URL: $BASE_URL"
echo "Company ID: $COMPANY_ID"
echo ""

# Test 1: Create News Article
echo "1. Creating news article..."
NEWS_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/news" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "삼성전자, 반도체 신기술 개발 성공",
    "source": "한국경제",
    "published_at": "2025-11-02T10:00:00Z",
    "summary": "차세대 3나노 공정 기술 개발에 성공하여 시장 경쟁력 강화 전망",
    "url": "https://example.com/news/123",
    "company_id": "'$COMPANY_ID'"
  }')

echo "$NEWS_RESPONSE" | jq '.'
NEWS_ID=$(echo "$NEWS_RESPONSE" | jq -r '.id // empty')

if [ -n "$NEWS_ID" ]; then
  echo "✓ News article created with ID: $NEWS_ID"
  echo "  Sentiment: $(echo "$NEWS_RESPONSE" | jq -r '.sentiment.label') (score: $(echo "$NEWS_RESPONSE" | jq -r '.sentiment.score'))"
else
  echo "✗ Failed to create news article"
  echo "$NEWS_RESPONSE"
fi
echo ""

# Test 2: Create Blind Post
echo "2. Creating Blind post..."
BLIND_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/social" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "blind",
    "title": "올해 실적 전망",
    "content": "올해 실적이 작년보다 좋을 것 같습니다. 신제품 출시도 예정되어 있고요.",
    "author": "익명_사원",
    "dept": "경영지원",
    "posted_at": "2025-11-02T15:30:00Z",
    "company_id": "'$COMPANY_ID'",
    "reply_count": 5,
    "like_count": 12
  }')

echo "$BLIND_RESPONSE" | jq '.'
BLIND_ID=$(echo "$BLIND_RESPONSE" | jq -r '.id // empty')

if [ -n "$BLIND_ID" ]; then
  echo "✓ Blind post created with ID: $BLIND_ID"
  echo "  Sentiment: $(echo "$BLIND_RESPONSE" | jq -r '.sentiment.label') (score: $(echo "$BLIND_RESPONSE" | jq -r '.sentiment.score'))"
else
  echo "✗ Failed to create Blind post"
  echo "$BLIND_RESPONSE"
fi
echo ""

# Test 3: Create Naver Forum Post
echo "3. Creating Naver forum post..."
NAVER_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/social" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "naver_forum",
    "title": "주가 전망",
    "content": "최근 실적 발표를 보니 생각보다 좋지 않네요. 조금 우려됩니다.",
    "posted_at": "2025-11-02T16:00:00Z",
    "company_id": "'$COMPANY_ID'",
    "reply_count": 15,
    "like_count": 8
  }')

echo "$NAVER_RESPONSE" | jq '.'
NAVER_ID=$(echo "$NAVER_RESPONSE" | jq -r '.id // empty')

if [ -n "$NAVER_ID" ]; then
  echo "✓ Naver forum post created with ID: $NAVER_ID"
  echo "  Sentiment: $(echo "$NAVER_RESPONSE" | jq -r '.sentiment.label') (score: $(echo "$NAVER_RESPONSE" | jq -r '.sentiment.score'))"
else
  echo "✗ Failed to create Naver forum post"
  echo "$NAVER_RESPONSE"
fi
echo ""

# Test 4: Create DART Filing
echo "4. Creating DART filing..."
FILING_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/dart-filings" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "분기보고서 (2025.Q3)",
    "filing_type": "분기보고서",
    "filed_at": "2025-11-01T09:00:00Z",
    "summary": "2025년 3분기 실적: 매출 증가, 영업이익 개선",
    "url": "https://dart.fss.or.kr/filing/789",
    "company_id": "'$COMPANY_ID'"
  }')

echo "$FILING_RESPONSE" | jq '.'
FILING_ID=$(echo "$FILING_RESPONSE" | jq -r '.id // empty')

if [ -n "$FILING_ID" ]; then
  echo "✓ DART filing created with ID: $FILING_ID"
  echo "  Sentiment: $(echo "$FILING_RESPONSE" | jq -r '.sentiment.label') (score: $(echo "$FILING_RESPONSE" | jq -r '.sentiment.score'))"
else
  echo "✗ Failed to create DART filing"
  echo "$FILING_RESPONSE"
fi
echo ""

# Test 5: Fetch created items
echo "5. Fetching news to verify..."
NEWS_LIST=$(curl -s "$BASE_URL/companies/$COMPANY_ID/news?limit=5")
echo "$NEWS_LIST" | jq '.data | length' | xargs -I {} echo "Found {} news articles"
echo ""

echo "6. Fetching Blind posts to verify..."
BLIND_LIST=$(curl -s "$BASE_URL/companies/$COMPANY_ID/blind-posts?limit=5")
echo "$BLIND_LIST" | jq '.data | length' | xargs -I {} echo "Found {} Blind posts"
echo ""

echo "7. Fetching DART filings to verify..."
FILING_LIST=$(curl -s "$BASE_URL/companies/$COMPANY_ID/dart-filings?limit=5")
echo "$FILING_LIST" | jq '.data | length' | xargs -I {} echo "Found {} DART filings"
echo ""

# Test 6: Test error cases
echo "8. Testing error cases..."

# Invalid company ID
echo "  a) Invalid company ID..."
ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/INVALID/news" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "source": "Test",
    "published_at": "2025-11-02T10:00:00Z",
    "company_id": "INVALID"
  }')
if echo "$ERROR_RESPONSE" | jq -e '.detail' > /dev/null; then
  echo "  ✓ Correctly returned error for invalid company"
else
  echo "  ✗ Should have returned error for invalid company"
fi

# Mismatched company_id
echo "  b) Mismatched company_id..."
ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/news" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "source": "Test",
    "published_at": "2025-11-02T10:00:00Z",
    "company_id": "999999"
  }')
if echo "$ERROR_RESPONSE" | jq -e '.detail' > /dev/null; then
  echo "  ✓ Correctly returned error for mismatched company_id"
else
  echo "  ✗ Should have returned error for mismatched company_id"
fi

echo ""
echo "=================================="
echo "Test completed!"

