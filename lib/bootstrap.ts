import { listDates, ensureDir, DATA_ROOT, REPORT_ROOT } from "./fs"
import { createMockDataFiles, getTodayKST } from "./mock"
import { generateStockReport, generateKTReport, generateTrendPrediction } from "./report"
import { parseForum, parseMarket } from "./parser"

export async function bootstrapData() {
  try {
    console.log("[v0] Ensuring data directories exist...")
    await ensureDir(DATA_ROOT)
    await ensureDir(REPORT_ROOT)

    const today = getTodayKST()
    console.log("[v0] Today's date (KST):", today)

    const dates = await listDates()
    console.log("[v0] Existing dates:", dates)

    // Check if today's data exists
    if (!dates.includes(today)) {
      console.log(`[v0] No data for ${today}, creating mock files...`)
      await createMockDataFiles(today)
      console.log("[v0] Mock data files created")

      // Generate initial reports
      try {
        const forumData = parseForum(
          `[Blind] 실적 무난, 배당 기대 ↑ (긍정)
[종토방] 단기 반등 이후 숨고르기 (중립)
[Reddit] Korea telcos undervalued thesis (긍정)`,
        )

        const marketData = parseMarket(`KT: 36,500 (+0.8%) | 거래량 2.1M`)

        const prediction = generateTrendPrediction(marketData, forumData)
        await generateStockReport(today, prediction)
        console.log("[v0] Stock report generated")

        await generateKTReport(
          today,
          "2025Q3 실적 양호, 매출 및 영업이익 전년 대비 증가",
          "AI 센터 확대 및 클라우드 사업 성장 관련 긍정적 뉴스",
          "전반적으로 긍정적 여론, 배당 기대감 높음",
        )
        console.log("[v0] KT report generated")

        console.log(`[v0] Created initial reports for ${today}`)
      } catch (reportError) {
        console.error("[v0] Error generating reports:", reportError)
        // Don't fail the entire bootstrap if report generation fails
      }
    } else {
      console.log(`[v0] Data for ${today} already exists`)
    }
  } catch (error) {
    console.error("[v0] Bootstrap error:", error)
    throw error
  }
}
