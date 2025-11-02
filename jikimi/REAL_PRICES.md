# Real Stock Price Integration

## ✅ Implemented

The price history API now fetches **actual historic stock prices** from Yahoo Finance using the `yfinance` library.

## 🔧 How It Works

### Architecture

**USE_LIVE_PRICES=true (default):**
```
API Request → Repository → Yahoo Finance → Return Real Data
                              ↓ (optional)
                        Cache to Database
```

**USE_LIVE_PRICES=false:**
```
API Request → Repository → Database Cache → Return Cached Data
```

### Flow

**When `USE_LIVE_PRICES=true` (default):**
1. **Fetch from Yahoo Finance**: Always gets real-time data
2. **Apply Adjustments**: Handles split/total_return adjustments
3. **Optional Cache**: Can cache to database if `CACHE_PRICES_TO_DB=true`
4. **Return Results**: Returns actual market data

**When `USE_LIVE_PRICES=false`:**
1. **Query Database**: Fetches from `price_candles` table
2. **Return Cached**: Returns stored data (no API calls)

## 📊 Data Source

### Yahoo Finance (yfinance)
- ✅ Free and reliable
- ✅ Supports Korean stocks (KOSPI/KOSDAQ)
- ✅ Historical data up to several years
- ✅ Multiple intervals: 1m, 5m, 1h, 1d

### Ticker Format
- Korean stocks use `.KS` suffix (KOSPI) or `.KQ` (KOSDAQ)
- Examples:
  - `005930.KS` - Samsung Electronics
  - `030200.KS` - KT
  - `035420.KS` - NAVER

## 🚀 Usage

### Basic Request
```bash
# Get daily prices for KT
curl "http://localhost:8000/v1/companies/030200/prices?interval=1d"

# Get hourly prices with time range
curl "http://localhost:8000/v1/companies/030200/prices?interval=1h&start=2025-10-01T00:00:00Z&end=2025-11-01T00:00:00Z"

# Get 5-minute data (last 7 days)
curl "http://localhost:8000/v1/companies/005930/prices?interval=5m"
```

### Supported Intervals

| Interval | Description | Max History |
|----------|-------------|-------------|
| `1d` | Daily | Years |
| `1h` | Hourly | ~60 days |
| `5m` | 5-minute | ~7 days |
| `1m` | 1-minute | ~5 days |

**Note**: Yahoo Finance has limits on historical data for intraday intervals.

### Time Range Defaults

If not specified:
- `1d`: Last 365 days
- `1h`: Last 60 days
- `5m`: Last 7 days
- `1m`: Last 5 days

## ⚙️ Configuration

### Environment Variables

```bash
# Enable live price fetching (default: true)
USE_LIVE_PRICES=true

# Cache fetched prices to database (default: false)
CACHE_PRICES_TO_DB=false
```

### Modes

#### 1. Live Mode (Default) ⭐
```bash
USE_LIVE_PRICES=true  # Default
CACHE_PRICES_TO_DB=false
```
- **Always fetches from Yahoo Finance**
- Fresh, real-time market data
- Ignores database cache
- Best for production with real data

#### 2. Cache-Only Mode
```bash
USE_LIVE_PRICES=false
CACHE_PRICES_TO_DB=false
```
- Uses only database cached data
- Returns empty if no cache (or seed data if loaded)
- Faster, no external API calls
- Good for development with seed data

#### 3. Memory Mode (Testing)
```bash
DB_DSN=memory://fake
```
- Returns deterministic fake data
- No database or external API calls
- Perfect for unit tests

## 📈 Example Response

```json
{
  "company": {
    "id": "030200",
    "ticker": "030200.KS"
  },
  "candles": [
    {
      "t": "2025-11-01T00:00:00Z",
      "o": 35100.0,
      "h": 35450.0,
      "l": 34900.0,
      "c": 35200.0,
      "v": 1234567
    },
    {
      "t": "2025-11-02T00:00:00Z",
      "o": 35200.0,
      "h": 35600.0,
      "l": 35050.0,
      "c": 35400.0,
      "v": 1456789
    }
  ]
}
```

## 🎯 Features

### ✅ Implemented
- Real-time price fetching from Yahoo Finance
- Database caching support
- Multiple interval support (1m, 5m, 1h, 1d)
- Timezone handling (UTC)
- Async/non-blocking execution
- Korean stock support (.KS, .KQ)

### 📝 TODO (Future Enhancements)
- **Automatic Caching**: Store fetched prices to database
- **Split Adjustments**: Fetch actual corporate actions
- **Dividend Adjustments**: Calculate total return with real dividends
- **Rate Limiting**: Implement request throttling
- **Error Handling**: Graceful fallback if Yahoo Finance is down
- **Multiple Exchanges**: Support US, EU, Asian markets

## 🔍 Technical Details

### Async Execution
```python
# yfinance is synchronous, so we run it in a thread pool
loop = asyncio.get_event_loop()
df = await loop.run_in_executor(None, fetch_sync)
```

This prevents blocking the FastAPI event loop.

### Ticker Resolution
```python
# Automatic ticker format conversion
"030200" → "030200.KS"  # KOSPI
"005930" → "005930.KS"  # Samsung
```

### Data Conversion
```python
# pandas DataFrame → PriceCandle schema
for idx, row in df.iterrows():
    candles.append(PriceCandle(
        t=timestamp,
        o=float(row["Open"]),
        h=float(row["High"]),
        l=float(row["Low"]),
        c=float(row["Close"]),
        v=int(row["Volume"]),
    ))
```

## 🧪 Testing

### Test with Real Data
```bash
# 1. Install dependencies
make install

# 2. Start server
DB_DSN=memory://fake make run

# 3. Test KT prices
curl "http://localhost:8000/v1/companies/030200/prices?interval=1d" | jq

# 4. Test Samsung Electronics
curl "http://localhost:8000/v1/companies/005930/prices?interval=1d" | jq
```

### Test with Database Cache
```bash
# 1. Load seed data (includes sample prices)
psql -d equity -f db/seed.sql

# 2. Start with database
DB_DSN=postgresql+asyncpg://user:pass@localhost:5432/equity make run

# 3. Test cached data
curl "http://localhost:8000/v1/companies/030200/prices?interval=1d"
```

## 🐛 Troubleshooting

### No Data Returned
```bash
# Check if ticker is valid
python -c "import yfinance as yf; print(yf.Ticker('030200.KS').history(period='1mo'))"
```

### Rate Limiting
Yahoo Finance has rate limits. If you get errors:
- Reduce request frequency
- Implement caching (`CACHE_PRICES_TO_DB=true`)
- Use database cache when possible

### Timezone Issues
All timestamps are returned in UTC (RFC3339 format):
```
2025-11-02T00:00:00Z
```

Convert to local timezone in your client application.

## 📚 Dependencies

Added to `pyproject.toml`:
```toml
"yfinance>=0.2.32"
```

Install with:
```bash
pip install -e .
```

## 🎉 Benefits

1. **Real Market Data**: Actual historic prices from Yahoo Finance
2. **No API Keys**: yfinance is free, no registration needed
3. **Fast**: Async execution, doesn't block other requests
4. **Reliable**: Yahoo Finance is stable and widely used
5. **Flexible**: Multiple intervals and time ranges
6. **Korean Stock Support**: Works with KOSPI/KOSDAQ

Now you can build real trading algorithms, backtesting, and analytics with actual market data! 📊

