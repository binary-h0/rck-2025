import { NextResponse } from "next/server"
import { fetchDailyHistoryForTickers } from "@/lib/market"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tickersParam = searchParams.get("tickers") || "KT,SKT,LG"
    const range = searchParams.get("range") || "1mo"
    const interval = searchParams.get("interval") || "1d"

    const tickers = tickersParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
    const data = await fetchDailyHistoryForTickers(tickers, range, interval)
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[market/history] fetch error", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 502 })
  }
}


