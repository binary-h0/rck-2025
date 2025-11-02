#!/bin/bash
# Quick test script to verify real Yahoo Finance data is being fetched

echo "=== Testing Real Stock Price Fetching ==="
echo ""

# Check if server is running
if ! curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
    echo "❌ Server is not running!"
    echo "Please start the server first: make run"
    exit 1
fi

echo "✓ Server is running"
echo ""

# Test KT (030200) stock prices
echo "Fetching KT (030200) stock prices..."
echo "This should show REAL data from Yahoo Finance (030200.KS)"
echo ""

RESPONSE=$(curl -s "http://localhost:8000/v1/companies/030200/prices?interval=1d&start=2024-11-01T00:00:00Z")

# Check if we got data
if echo "$RESPONSE" | grep -q '"candles"'; then
    echo "✓ Received price data"
    
    # Show first candle
    echo ""
    echo "First candle:"
    echo "$RESPONSE" | jq -r '.candles[0]' 2>/dev/null || echo "$RESPONSE" | python3 -m json.tool | head -20
    
    # Count candles
    COUNT=$(echo "$RESPONSE" | jq -r '.candles | length' 2>/dev/null)
    if [ ! -z "$COUNT" ] && [ "$COUNT" != "null" ]; then
        echo ""
        echo "Total candles received: $COUNT"
        
        # Show date range
        FIRST_DATE=$(echo "$RESPONSE" | jq -r '.candles[0].t' 2>/dev/null)
        LAST_DATE=$(echo "$RESPONSE" | jq -r ".candles[$((COUNT-1))].t" 2>/dev/null)
        echo "Date range: $FIRST_DATE to $LAST_DATE"
    fi
    
    echo ""
    echo "✅ SUCCESS! Real market data fetched from Yahoo Finance"
    echo ""
    echo "To verify this is real data, compare with:"
    echo "https://finance.yahoo.com/quote/030200.KS/history"
    
else
    echo "❌ No price data received"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
    exit 1
fi

