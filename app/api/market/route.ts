import { NextResponse } from "next/server"
import { fetchRealtimeKT, fetchRealtimeForTickers } from "@/lib/market"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tickersParam = searchParams.get("tickers")

    if (tickersParam) {
      const tickers = tickersParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
      const list = await fetchRealtimeForTickers(tickers)
      return NextResponse.json({ data: list }, { headers: { "Cache-Control": "no-store" } })
    }

    const kt = await fetchRealtimeKT()
    return NextResponse.json({ data: kt, ticker: "KT" }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[market] realtime fetch error", error)
    return NextResponse.json({ error: "Failed to fetch realtime market" }, { status: 502 })
  }
}