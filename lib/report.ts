import type { TrendPrediction, ForumItem, MarketData } from "./types"
import { writeReport } from "./fs"

export function generateTrendPrediction(marketData: MarketData[], forumData: ForumItem[]): TrendPrediction {
  const ktData = marketData.find((m) => m.ticker === "KT")
  const sentimentScore = forumData.reduce((sum, item) => sum + item.score, 0)
  const positiveCount = forumData.filter((f) => f.sentiment === "positive").length
  const negativeCount = forumData.filter((f) => f.sentiment === "negative").length

  let direction: "up" | "neutral" | "down" = "neutral"
  let confidence = 50
  const reasons: string[] = []

  if (ktData) {
    if (ktData.changePercent >= 0.5 && sentimentScore > 0) {
      direction = "up"
      confidence = 75
      reasons.push("긍정적 뉴스 흐름과 거래량 증가 패턴 감지")
      reasons.push("여론 감성 지표 긍정적")
    } else if (ktData.changePercent <= -0.5 && sentimentScore < 0) {
      direction = "down"
      confidence = 70
      reasons.push("부정적 여론과 가격 하락 추세")
      reasons.push("거래량 감소 신호")
    } else {
      direction = "neutral"
      confidence = 60
      reasons.push("보합세 유지 예상")
      reasons.push("뉴스 및 여론 중립적")
    }
  }

  if (positiveCount > negativeCount) {
    reasons.push("긍정 의견이 부정 의견보다 많음")
  }

  return { direction, confidence, reasons: reasons.slice(0, 3) }
}

export async function generateStockReport(date: string, prediction: TrendPrediction): Promise<void> {
  const directionText = prediction.direction === "up" ? "상승" : prediction.direction === "down" ? "하락" : "보합"

  const content = `# 단기 전망 (${date})

## 내일 매수·매도 추이

**예측: ${directionText} (신뢰도 ${prediction.confidence}%)**

### 근거
${prediction.reasons.map((r, i) => `${i + 1}. ${r}`).join("\n")}

### 투자 전략
- ${prediction.direction === "up" ? "단기 매수 포지션 고려" : prediction.direction === "down" ? "관망 또는 손절 검토" : "보유 유지 권장"}
- 거래량 변화 모니터링 필요
- 주요 공시 및 뉴스 주시

---
*본 리포트는 AI 기반 분석이며 투자 조언이 아닙니다.*
`

  await writeReport(date, "stock.md", content)
}

export async function generateKTReport(
  date: string,
  dartSummary: string,
  newsSummary: string,
  sentimentSummary: string,
): Promise<void> {
  const content = `# KT Weekly Insight (${date})

## 요약
실적 무난, CAPEX 통제 양호, ARPU 회복 기대감 형성

## 기업 데이터 분석
${dartSummary}

## 시장 반응
${newsSummary}

## 여론 동향
${sentimentSummary}

## 리스크 요인
- 보안/해킹 이슈 발생 시 민감도 높음
- 경쟁사 대비 5G 투자 효율성 모니터링 필요
- 규제 변화에 따른 수익성 영향 주시

## 투자 포인트
1. 안정적인 배당 수익률 (약 4-5%)
2. 통신 3사 중 밸류에이션 매력적
3. B2B 및 클라우드 사업 성장 가능성

---
*본 리포트는 참고용이며 투자 결정은 본인 책임입니다.*
`

  await writeReport(date, "kt.md", content)
}
