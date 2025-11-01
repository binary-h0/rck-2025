import { NextResponse } from "next/server"
import { readSourceFile } from "@/lib/fs"
import { parseForum, parseMarket } from "@/lib/parser"
import { generateStockReport, generateKTReport, generateTrendPrediction } from "@/lib/report"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, kinds } = body

    if (!date || !kinds || !Array.isArray(kinds)) {
      return NextResponse.json({ error: "Date and kinds array required" }, { status: 400 })
    }

    const generated: string[] = []

    // Read necessary data
    const forumContent = await readSourceFile(date, "forum.txt")
    const marketContent = await readSourceFile(date, "market.txt")
    const dartContent = await readSourceFile(date, "dart.txt")
    const newsContent = await readSourceFile(date, "news.txt")

    const forumData = parseForum(forumContent)
    const marketData = parseMarket(marketContent)

    // Generate requested reports
    for (const kind of kinds) {
      if (kind === "stock") {
        const prediction = generateTrendPrediction(marketData, forumData)
        await generateStockReport(date, prediction)
        generated.push(`stock.md`)
      } else if (kind === "kt") {
        const dartSummary = dartContent.split("\n")[0] || "데이터 없음"
        const newsSummary = newsContent.split("\n").slice(0, 2).join(", ") || "데이터 없음"
        const sentimentSummary =
          forumData.length > 0
            ? `긍정 ${forumData.filter((f) => f.sentiment === "positive").length}건, 중립 ${forumData.filter((f) => f.sentiment === "neutral").length}건, 부정 ${forumData.filter((f) => f.sentiment === "negative").length}건`
            : "데이터 없음"

        await generateKTReport(date, dartSummary, newsSummary, sentimentSummary)
        generated.push(`kt.md`)
      }
    }

    return NextResponse.json({
      success: true,
      date,
      generated,
    })
  } catch (error) {
    console.error("[v0] Error generating reports:", error)
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 })
  }
}
