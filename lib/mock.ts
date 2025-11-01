export function getMockDartData(date: string): string {
  return `2025Q3 매출 6.12조(+3.1% YoY), 영업이익 4,150억(+2.3% YoY)
5G CAPEX 8,200억 집행, 인건비 전년동기비 +1.2%
자사주 보유 1.2% (변동없음)
부채비율 142% (전분기 대비 -3%p)
당기순이익 3,280억 (+5.4% YoY)`
}

export function getMockNewsData(date: string): string {
  return `[09:10] 파이낸셜뉴스 | KT, AI센터 확대… B2B 수주 확대 기대
[11:35] 전자공시 | 최대주주 변동 없음 공시
[13:05] 블룸버그 | 통신 3사, ARPU 회복세
[14:20] 한국경제 | KT 클라우드 사업 매출 20% 증가
[16:45] 연합뉴스 | 5G 가입자 1000만 돌파`
}

export function getMockForumData(date: string): string {
  return `[Blind] 실적 무난, 배당 기대 ↑ (긍정)
[종토방] 단기 반등 이후 숨고르기 (중립)
[Reddit] Korea telcos undervalued thesis (긍정)
[DC] 실시간 체감 품질 글 늘었음 (중립)
[Blind] 경쟁사 대비 밸류에이션 매력적 (긍정)`
}

export function getMockMarketData(date: string): string {
  return `KT: 36,500 (+0.8%) | 거래량 2.1M
SKT: 56,800 (+0.4%) | 거래량 1.3M
LGU+: 9,850 (+0.3%) | 거래량 0.9M`
}

export async function createMockDataFiles(date: string) {
  const { writeSourceFile } = await import("./fs")

  await writeSourceFile(date, "dart.txt", getMockDartData(date))
  await writeSourceFile(date, "news.txt", getMockNewsData(date))
  await writeSourceFile(date, "forum.txt", getMockForumData(date))
  await writeSourceFile(date, "market.txt", getMockMarketData(date))

  console.log(`[v0] Created mock data files for ${date}`)
}

export function getTodayKST(): string {
  const now = new Date()
  const kstOffset = 9 * 60 // KST is UTC+9
  const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)
  return kstTime.toISOString().split("T")[0]
}
