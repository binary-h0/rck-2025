import type { MarketData } from "./types"

const KRX_CODES: Record<string, string> = {
  KT: "030200", // KT
  SKT: "017670", // SK Telecom
  LG: "032640", // LG Uplus (LGU+)
}

function buildPollingUrl(krxCodes: string[]): string {
  const query = krxCodes.join(",")
  return `https://polling.finance.naver.com/api/realtime?query=SERVICE_ITEM:${query}`
}

async function fetchFromNaverPollingMulti(krxCodes: string[]): Promise<Record<string, any>[]> {
  const url = buildPollingUrl(krxCodes)
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Referer": "https://finance.naver.com/",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Naver polling error: HTTP ${res.status}`)
  }

  const json = await res.json().catch(() => ({} as any))
  const datas: Record<string, any>[] = json?.result?.areas?.[0]?.datas || []
  return datas
}

function normalizeMarketData(raw: any, codeToTicker: Record<string, string>): MarketData | null {
  const code = raw?.cd
  const ticker = codeToTicker[code]
  if (!ticker) return null

  const price = Number(raw.nv)
  const change = Number(raw.cv)
  const changePercent = Number(raw.cr)
  const volumeRaw = raw.aq ?? raw.tv ?? raw.at ?? 0
  const volume = typeof volumeRaw === "number" ? volumeRaw.toLocaleString() : String(volumeRaw)

  return {
    ticker,
    price: Number.isFinite(price) ? price : 0,
    change: Number.isFinite(change) ? change : 0,
    changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    volume,
  }
}

export async function fetchRealtimeForTickers(tickers: string[]): Promise<MarketData[]> {
  // 허용된 티커만 매핑
  const filtered = tickers.filter((t) => t in KRX_CODES)
  const codes = filtered.map((t) => KRX_CODES[t])
  if (codes.length === 0) return []

  const datas = await fetchFromNaverPollingMulti(codes)
  const codeToTicker: Record<string, string> = Object.fromEntries(filtered.map((t) => [KRX_CODES[t], t]))
  const normalized = datas
    .map((d) => normalizeMarketData(d, codeToTicker))
    .filter((v): v is MarketData => Boolean(v))

  // 요청 순서대로 정렬
  const order: Record<string, number> = Object.fromEntries(filtered.map((t, i) => [t, i]))
  normalized.sort((a, b) => order[a.ticker] - order[b.ticker])
  return normalized
}

export async function fetchRealtimeKT(): Promise<MarketData> {
  const list = await fetchRealtimeForTickers(["KT"])
  return list[0]
}

// =========================
// Daily History (Yahoo)
// =========================

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      indicators?: {
        quote?: Array<{ close?: (number | null)[] }>
      }
    }>
  }
}

const YAHOO_SYMBOLS: Record<string, string> = {
  KT: "030200.KS",
  SKT: "017670.KS",
  LG: "032640.KS",
}

function toDateString(tsSec: number): string {
  const d = new Date(tsSec * 1000)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export type DailyPoint = {
  date: string
  KT?: number
  SKT?: number
  LG?: number
}

function subtractRangeFromToday(range: string): { start: string; end: string } {
  const endDate = new Date()
  const startDate = new Date(endDate)
  const m = range.toLowerCase()
  if (m === "1mo") startDate.setMonth(startDate.getMonth() - 1)
  else if (m === "3mo") startDate.setMonth(startDate.getMonth() - 3)
  else if (m === "6mo") startDate.setMonth(startDate.getMonth() - 6)
  else if (m === "1y" || m === "12mo") startDate.setFullYear(startDate.getFullYear() - 1)
  else if (m === "2y") startDate.setFullYear(startDate.getFullYear() - 2)
  else if (m === "5y") startDate.setFullYear(startDate.getFullYear() - 5)
  else startDate.setMonth(startDate.getMonth() - 1)

  const toYmd = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}${mm}${dd}`
  }
  return { start: toYmd(startDate), end: toYmd(endDate) }
}

function tryParseNaverSiseJson(raw: string): any[] {
  // 1) 빠른 경로: JSON.parse 시도
  try {
    return JSON.parse(raw)
  } catch {}
  // 2) 단일 인용부호를 이중 인용부호로 교체하고 공백 제거 후 시도
  try {
    const sanitized = raw
      .replace(/\r|\n|\t/g, "")
      .replace(/'/g, '"')
      .replace(/,\s*]/g, "]")
      .replace(/,\s*\]/g, "]")
    return JSON.parse(sanitized)
  } catch {}
  // 3) 대괄호 영역만 추출 후 재시도
  try {
    const start = raw.indexOf("[")
    const end = raw.lastIndexOf("]")
    if (start >= 0 && end > start) {
      const slice = raw.slice(start, end + 1)
      const sanitized = slice.replace(/\r|\n|\t/g, "").replace(/'/g, '"').replace(/,\s*]/g, "]")
      return JSON.parse(sanitized)
    }
  } catch {}
  throw new Error("Failed to parse Naver siseJson response")
}

async function fetchNaverDaily(symbol: string, range: string): Promise<Array<{ date: string; close: number }>> {
  const { start, end } = subtractRangeFromToday(range)
  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${symbol}&requestType=1&startTime=${start}&endTime=${end}&timeframe=day`
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer: "https://finance.naver.com",
    },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Naver history error: HTTP ${res.status}`)
  const text = await res.text()
  const json = tryParseNaverSiseJson(text) as any[]
  // [ ["날짜","시가","고가","저가","종가","전일비","거래량"], ["2024.10.16",..., "42700", ...], ...]
  const rows = json.slice(1) as any[]
  const pairs: Array<{ date: string; close: number }> = []
  for (const row of rows) {
    const [dateStr,,,, close] = row
    if (!dateStr || !close) continue
    const date = String(dateStr).replace(/\./g, "-")
    const value = Number(close)
    if (Number.isFinite(value)) pairs.push({ date, close: value })
  }
  return pairs
}

export async function fetchDailyHistoryForTickers(
  tickers: string[],
  range: string = "1mo",
  _interval: string = "1d",
): Promise<DailyPoint[]> {
  const filtered = tickers.filter((t) => t in KRX_CODES)
  if (filtered.length === 0) return []

  const codeMap: Record<string, string> = Object.fromEntries(filtered.map((t) => [t, KRX_CODES[t]]))

  const results = await Promise.all(
    filtered.map(async (t) => {
      const symbol = codeMap[t]
      const pairs = await fetchNaverDaily(symbol, range)
      return { ticker: t, pairs }
    }),
  )

  const dateSet = new Set<string>()
  for (const r of results) {
    for (const p of r.pairs) dateSet.add(p.date)
  }
  const dates = Array.from(dateSet).sort()

  const byTicker: Record<string, Record<string, number>> = {}
  for (const r of results) {
    byTicker[r.ticker] = {}
    for (const p of r.pairs) byTicker[r.ticker][p.date] = p.close
  }

  const merged: DailyPoint[] = dates.map((date) => {
    const point: DailyPoint = { date }
    for (const t of filtered) {
      const v = byTicker[t][date]
      if (typeof v === "number") {
        if (t === "KT") point.KT = v
        else if (t === "SKT") point.SKT = v
        else if (t === "LG") point.LG = v
      }
    }
    return point
  })

  return merged
}


