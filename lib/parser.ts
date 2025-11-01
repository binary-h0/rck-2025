import type { DartData, NewsItem, ForumItem, MarketData } from "./types"

export function parseDart(content: string): DartData {
  const lines = content.split("\n").filter((l) => l.trim())
  const data: DartData = {
    revenue: "",
    operatingIncome: "",
    capex: "",
    headcount: "",
    treasury: "",
  }

  lines.forEach((line) => {
    if (line.includes("매출")) data.revenue = line
    if (line.includes("영업이익")) data.operatingIncome = line
    if (line.includes("CAPEX")) data.capex = line
    if (line.includes("인건비")) data.headcount = line
    if (line.includes("자사주")) data.treasury = line
  })

  return data
}

export function parseNews(content: string): NewsItem[] {
  const lines = content.split("\n").filter((l) => l.trim())
  const items: NewsItem[] = []

  lines.forEach((line) => {
    const parts = line.split("|").map((p) => p.trim())
    // New v2 format: title | url | source
    if (parts.length >= 3 && parts[1].startsWith("http")) {
      items.push({
        time: "",
        source: parts[2] || "",
        title: parts[0] || "",
        url: parts[1] || undefined,
      })
      return
    }
    // New v1 format: pubDate | source | title | url
    if (parts.length >= 4 && parts[3].startsWith("http")) {
      items.push({
        time: parts[0] || "",
        source: parts[1] || "",
        title: parts[2] || "",
        url: parts[3] || undefined,
      })
      return
    }
    // Legacy format: [HH:MM]Source | Title | (Sentiment)
    if (parts.length >= 2) {
      const timeMatch = parts[0].match(/\[(\d{2}:\d{2})\]/)
      items.push({
        time: timeMatch ? timeMatch[1] : "",
        source: parts[0].replace(/\[\d{2}:\d{2}\]/, "").trim(),
        title: parts[1],
        sentiment: parts[2] || undefined,
      })
    }
  })

  return items
}

export function parseForum(content: string): ForumItem[] {
  const lines = content.split("\n").filter((l) => l.trim())
  const items: ForumItem[] = []

  lines.forEach((line) => {
    const platformMatch = line.match(/\[(.*?)\]/)
    const sentimentMatch = line.match(/$$(긍정|중립|부정)$$/)

    if (platformMatch && sentimentMatch) {
      const platform = platformMatch[1]
      const sentiment = sentimentMatch[1]
      const content = line
        .replace(/\[.*?\]/, "")
        .replace(/$$긍정|중립|부정$$/, "")
        .trim()

      let sentimentType: "positive" | "neutral" | "negative" = "neutral"
      let score = 0

      if (sentiment === "긍정") {
        sentimentType = "positive"
        score = 1
      } else if (sentiment === "부정") {
        sentimentType = "negative"
        score = -1
      }

      items.push({
        platform,
        content,
        sentiment: sentimentType,
        score,
      })
    }
  })

  return items
}

export function parseMarket(content: string): MarketData[] {
  const lines = content.split("\n").filter((l) => l.trim())
  const items: MarketData[] = []

  lines.forEach((line) => {
    const parts = line.split("|").map((p) => p.trim())
    if (parts.length >= 2) {
      const [ticker, priceInfo] = parts
      const priceMatch = priceInfo.match(/([\d,]+)\s*$$([+-]?[\d.]+)%?$$/)

      if (priceMatch) {
        const price = Number.parseInt(priceMatch[1].replace(/,/g, ""))
        const changePercent = Number.parseFloat(priceMatch[2])
        const change = Math.round((price * changePercent) / 100)

        items.push({
          ticker: ticker.replace(":", "").trim(),
          price,
          change,
          changePercent,
          volume: parts[2] || "",
        })
      }
    }
  })

  return items
}
