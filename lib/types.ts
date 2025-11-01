export interface ParsedData {
  date: string
  sources: {
    [key: string]: SourceData
  }
}

export interface SourceData {
  filename: string
  lines: string[]
  parsed: any
}

export interface DartData {
  revenue: string
  operatingIncome: string
  capex: string
  headcount: string
  treasury: string
}

export interface NewsItem {
  time: string
  source: string
  title: string
  url?: string
  sentiment?: string
}

export interface ForumItem {
  platform: string
  content: string
  sentiment: "positive" | "neutral" | "negative"
  score: number
}

export interface MarketData {
  ticker: string
  price: number
  change: number
  changePercent: number
  volume: string
}

export interface ReportMetadata {
  date: string
  filename: string
  kind: string
  path: string
}

export interface TrendPrediction {
  direction: "up" | "neutral" | "down"
  confidence: number
  reasons: string[]
}
