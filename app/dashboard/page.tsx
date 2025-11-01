"use client"

import { useEffect, useState } from "react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart as ReLineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary"
import { isSafeMode } from "@/lib/safeMode"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Download,
  LineChart,
  Newspaper,
  Target,
  BarChart3,
  MessageSquare,
  UploadIcon,
  FileText,
} from "lucide-react"
import type { ParsedData, MarketData, NewsItem, ForumItem } from "@/lib/types"

type SeriesPoint = {
  time: string
  KT?: number
  SKT?: number
  LG?: number
}

type DailyPoint = {
  date: string
  KT?: number
  SKT?: number
  LG?: number
}

export default function DashboardPage() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [data, setData] = useState<ParsedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [safeMode, setSafeMode] = useState(false)
  const [realtime, setRealtime] = useState<MarketData | null>(null)
  const [realtimePeers, setRealtimePeers] = useState<MarketData[] | null>(null)
  const [historySeries, setHistorySeries] = useState<DailyPoint[] | null>(null)
  const [realtimeError, setRealtimeError] = useState<string | null>(null)
  const { toast } = useToast()
  const [newsShowAll, setNewsShowAll] = useState(false)

  useEffect(() => {
    setSafeMode(isSafeMode())
    initializeData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchData(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    let intervalId: number | undefined
    let abort = false

    async function fetchRealtime() {
      try {
        const res = await fetch("/api/market", { cache: "no-store" }).catch(() => null)
        if (!res || !res.ok) throw new Error("realtime fetch failed")
        const json = await res.json()
        if (abort) return
        setRealtime(json.data as MarketData)
        setRealtimeError(null)
      } catch (e) {
        if (abort) return
        setRealtimeError("실시간 주가 갱신 실패")
      }
    }

    async function fetchRealtimePeers() {
      try {
        const res = await fetch("/api/market?tickers=KT,SKT,LG", { cache: "no-store" }).catch(() => null)
        if (!res || !res.ok) throw new Error("realtime peers fetch failed")
        const json = await res.json()
        if (abort) return
        const list = json.data as MarketData[]
        setRealtimePeers(list)
      } catch (e) {
        if (abort) return
        // peers 는 필수는 아니므로 에러는 노출하지 않음
      }
    }

    async function fetchDailyHistory() {
      try {
        const res = await fetch("/api/market/history?tickers=KT,SKT,LG&range=12mo", { cache: "no-store" }).catch(() => null)
        if (!res || !res.ok) throw new Error("history fetch failed")
        const json = await res.json()
        if (abort) return
        setHistorySeries(json.data as DailyPoint[])
      } catch (e) {
        // 조용히 실패 허용
      }
    }

    // 초기 즉시 호출 후 5초 간격 폴링
    fetchRealtime()
    fetchRealtimePeers()
    intervalId = window.setInterval(() => {
      fetchRealtime()
      fetchRealtimePeers()
    }, 5000)

    // 일별 히스토리 1회 로드
    fetchDailyHistory()

    return () => {
      abort = true
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  async function initializeData() {
    try {
      const bootstrapRes = await fetch("/api/bootstrap", { method: "POST" }).catch(() => null)

      if (!bootstrapRes || !bootstrapRes.ok) {
        console.warn("[v0] Bootstrap failed, continuing with empty state")
        setError("데이터 초기화 실패 - 파일을 업로드하거나 리포트를 생성해주세요")
        setLoading(false)
        return
      }

      // Trigger news collection for today (best-effort)
      await fetch("/api/news").catch(() => null)

      await fetchDates()
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      setError("초기화 중 오류 발생 - 업로드 페이지에서 데이터를 추가해주세요")
      setLoading(false)
    }
  }

  async function fetchDates() {
    try {
      const res = await fetch("/api/dates").catch(() => null)

      if (!res || !res.ok) {
        throw new Error("Failed to fetch dates")
      }

      const json = await res.json()
      setDates(json.dates || [])

      if (json.dates && json.dates.length > 0) {
        setSelectedDate(json.dates[0])
      } else {
        setError("사용 가능한 데이터가 없습니다")
        setLoading(false)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dates:", error)
      setError("날짜 목록을 불러올 수 없습니다")
      setLoading(false)
    }
  }

  async function fetchData(date: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/data?date=${date}`).catch(() => null)
      if (!res || !res.ok) throw new Error("Failed to fetch data")
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("[v0] Failed to fetch data:", error)
      setError("데이터를 불러올 수 없습니다")
      toast({
        title: "데이터 로드 실패",
        description: "데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetch("/api/refresh-cache", { method: "POST" }).catch(() => null)
      if (selectedDate) {
        await fetchData(selectedDate)
      }
      toast({
        title: "새로고침 완료",
        description: "데이터가 업데이트되었습니다.",
      })
    } catch (error) {
      console.error("[v0] Failed to refresh:", error)
      toast({
        title: "새로고침 실패",
        description: "캐시 초기화 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const marketData: MarketData[] = data?.sources?.market?.parsed || []
  const newsData: NewsItem[] = data?.sources?.news?.parsed || []
  const forumData: ForumItem[] = data?.sources?.forum?.parsed || []
  const ktDataFromParsed = marketData.find((m) => m.ticker === "KT")
  const ktData = (realtime ?? ktDataFromParsed) || null

  // --- 다음 날 예측(간단한 평균 수익률 기반) ---
  const prediction = (() => {
    if (!historySeries || historySeries.length < 25) return null
    const series = historySeries
      .map((d) => ({ date: d.date, close: d.KT }))
      .filter((p) => typeof p.close === "number") as { date: string; close: number }[]
    if (series.length < 25) return null
    const lastClose = series[series.length - 1].close
    const windowSize = 20
    const returns: number[] = []
    for (let i = series.length - windowSize; i < series.length; i++) {
      const prev = series[i - 1]
      const curr = series[i]
      if (!prev || !curr) continue
      if (prev.close > 0) returns.push(curr.close / prev.close - 1)
    }
    if (returns.length < 5) return null
    const avg = returns.reduce((s, r) => s + r, 0) / returns.length
    const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length
    const vol = Math.sqrt(variance)
    const predictedPrice = Math.round(lastClose * (1 + avg))
    const predictedChangePct = +(avg * 100).toFixed(2)
    // 신뢰도: 변동성이 낮을수록 높게 (대략적 스케일링)
    const confidence = Math.max(0, Math.min(1, 0.6 - vol * 8))
    return { lastClose, predictedPrice, predictedChangePct, confidence, windowSize }
  })()

  const sentimentScore = forumData.reduce((sum, item) => sum + item.score, 0)
  const positiveCount = forumData.filter((f) => f.sentiment === "positive").length
  const negativeCount = forumData.filter((f) => f.sentiment === "negative").length
  const neutralCount = forumData.filter((f) => f.sentiment === "neutral").length

  let trendDirection: "up" | "neutral" | "down" = "neutral"
  if (ktData && ktData.changePercent >= 0.5 && sentimentScore > 0) {
    trendDirection = "up"
  } else if (ktData && ktData.changePercent <= -0.5 && sentimentScore < 0) {
    trendDirection = "down"
  }

  const EmptyState = ({ icon: Icon, title, description, actions }: any) => (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
        <Icon className="h-8 w-8 text-neutral-400" />
      </div>
      <div>
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      </div>
      {actions && <div className="flex gap-2 justify-center">{actions}</div>}
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#E60012] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">KT</span>
            </div>
            <span className="font-bold text-xl">우리사주지Ki미</span>
            {safeMode && (
              <Badge variant="outline" className="ml-2">
                SAFE MODE
              </Badge>
            )}
          </div>
          <nav className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              홈
            </a>
            <a href="/dashboard" className="text-sm font-medium text-[#E60012]">
              대시보드
            </a>
            <a href="/my" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              My우리사주
            </a>
            <a href="/upload" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              업로드
            </a>
            <a href="/reports" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              리포트
            </a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-600 mb-2 block">날짜 선택</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white"
                disabled={dates.length === 0}
              >
                {dates.length === 0 ? (
                  <option>데이터 없음</option>
                ) : (
                  dates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing || !selectedDate} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 flex items-center justify-between">
              <span>{error}</span>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => (window.location.href = "/upload")}>
                  <UploadIcon className="h-3 w-3 mr-1" />
                  업로드
                </Button>
                <Button size="sm" variant="outline" onClick={() => (window.location.href = "/reports")}>
                  <FileText className="h-3 w-3 mr-1" />
                  리포트
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#E60012] border-r-transparent" />
            <p className="mt-4 text-neutral-600">데이터 로딩 중...</p>
          </div>
        ) : (
          <>
            {/* Data Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <ClientErrorBoundary>
                <Card className="border-2 hover:border-[#E60012] transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-[#E60012]" />
                      실시간 KT 주가
                    </CardTitle>
                    <CardDescription>현재가 및 거래량 정보</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ktData ? (
                      <>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-3xl font-bold">{ktData.price.toLocaleString()}원</div>
                            <div
                              className={`flex items-center gap-2 text-sm ${ktData.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {ktData.changePercent >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {ktData.change >= 0 ? "+" : ""}
                              {ktData.change.toLocaleString()}원 ({ktData.changePercent >= 0 ? "+" : ""}
                              {ktData.changePercent}%)
                            </div>
                          </div>
                          <Badge className={ktData.changePercent >= 0 ? "bg-green-500" : "bg-red-500"}>
                            {ktData.changePercent >= 0 ? "상승" : "하락"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-neutral-500">거래량</div>
                            <div className="font-semibold">{ktData.volume}</div>
                          </div>
                          {realtimeError && (
                            <div className="text-xs text-neutral-500 col-span-2">{realtimeError}</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon={LineChart}
                        title="주가 데이터 없음"
                        description="시장 데이터를 업로드해주세요"
                        actions={
                          <Button size="sm" variant="outline" onClick={() => (window.location.href = "/upload")}>
                            업로드하기
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </ClientErrorBoundary>

              <ClientErrorBoundary>
                <Card className="border-2 hover:border-[#E60012] transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Newspaper className="h-5 w-5 text-[#E60012]" />
                      오늘의 KT 뉴스
                    </CardTitle>
                    <CardDescription>AI 요약 주요 뉴스</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {newsData.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {newsData.map((news, idx) => (
                          <div key={idx} className="space-y-1">
                            <a className="text-sm font-medium underline" href={news.url || "#"} target="_blank" rel="noopener noreferrer">
                              {news.title}
                            </a>
                            <div className="text-xs text-neutral-500">
                              {news.source} • {news.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Newspaper}
                        title="뉴스 데이터 없음"
                        description="뉴스 데이터를 업로드해주세요"
                        actions={
                          <Button size="sm" variant="outline" onClick={() => (window.location.href = "/upload")}>
                            업로드하기
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </ClientErrorBoundary>

              <ClientErrorBoundary>
                <Card
                  className={`border-2 transition-colors ${trendDirection === "up" ? "bg-gradient-to-br from-green-50 to-white" : trendDirection === "down" ? "bg-gradient-to-br from-red-50 to-white" : "bg-gradient-to-br from-neutral-50 to-white"}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#E60012]" />
                      내일 주가 예측
                    </CardTitle>
                    <CardDescription>과거 일별 수익률(최근 20일) 기반 간이 예측</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ktData ? (
                      <>
                        {prediction ? (
                          <>
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="text-sm text-neutral-500">예측 종가</div>
                                <div className="text-3xl font-bold">
                                  {prediction.predictedPrice.toLocaleString()}원
                                </div>
                                <div className={`flex items-center gap-2 text-sm ${prediction.predictedChangePct >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {prediction.predictedChangePct >= 0 ? (
                                    <TrendingUp className="h-4 w-4" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4" />
                                  )}
                                  {prediction.predictedChangePct >= 0 ? "+" : ""}
                                  {prediction.predictedChangePct}%
                                </div>
                              </div>
                              <Badge className={prediction.predictedChangePct >= 0 ? "bg-green-500" : "bg-red-500"}>
                                {prediction.predictedChangePct >= 0 ? "상승" : "하락"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-neutral-500">기준 종가</div>
                                <div className="font-semibold">{prediction.lastClose.toLocaleString()}원</div>
                              </div>
                              <div>
                                <div className="text-neutral-500">신뢰도</div>
                                <div className="font-semibold">{Math.round(prediction.confidence * 100)}%</div>
                              </div>
                            </div>
                            <div className="text-xs text-neutral-500">최근 {prediction.windowSize}거래일 평균 수익률 기반 단순 예측입니다. 참고용으로만 사용하세요.</div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div
                                className={`text-2xl font-bold ${trendDirection === "up" ? "text-green-600" : trendDirection === "down" ? "text-red-600" : "text-neutral-600"}`}
                              >
                                {trendDirection === "up" ? "상승 예상" : trendDirection === "down" ? "하락 예상" : "보합 예상"}
                              </div>
                              {trendDirection === "up" ? (
                                <TrendingUp className="h-8 w-8 text-green-600" />
                              ) : trendDirection === "down" ? (
                                <TrendingDown className="h-8 w-8 text-red-600" />
                              ) : (
                                <Minus className="h-8 w-8 text-neutral-600" />
                              )}
                            </div>
                            <div className="text-xs text-neutral-500">예측을 위한 일별 데이터가 부족하여 기본 트렌드로 표시합니다.</div>
                          </>
                        )}
                      </>
                    ) : (
                      <EmptyState
                        icon={Target}
                        title="예측 데이터 없음"
                        description="리포트를 생성해주세요"
                        actions={
                          <Button size="sm" variant="outline" onClick={() => (window.location.href = "/reports")}>
                            리포트 생성
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </ClientErrorBoundary>

              <ClientErrorBoundary>
                <Card className="border-2 hover:border-[#E60012] transition-colors md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#E60012]" />
                      통신 3사 비교
                    </CardTitle>
                    <CardDescription>KT vs SKT vs LGU+ 주가 성과</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {marketData.length > 0 || (realtimePeers && realtimePeers.length > 0) ? (
                      <div className="space-y-4">
                        <div className="p-2 bg-white rounded-lg">
                          {historySeries && historySeries.length >= 2 && (
                            <ChartContainer
                              id="telcos-daily"
                              className="w-full h-64"
                              config={{ KT: { label: "KT", color: "#E60012" }, SKT: { label: "SKT", color: "#1f2937" }, LG: { label: "LG", color: "#db2777" } }}
                            >
                              <ReLineChart data={historySeries} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" minTickGap={20} />
                                <YAxis domain={["dataMin", "dataMax"]} width={60} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line type="monotone" dataKey="KT" stroke="var(--color-KT)" strokeWidth={2} dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="SKT" stroke="var(--color-SKT)" strokeWidth={2} dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="LG" stroke="var(--color-LG)" strokeWidth={2} dot={false} isAnimationActive={false} />
                              </ReLineChart>
                            </ChartContainer>
                          )}
                        </div>
                        {(realtimePeers ?? marketData).map((stock, idx) => {
                          const display = (() => {
                            if (realtimePeers) return stock
                            return stock.ticker === "KT" && realtime ? { ...stock, ...realtime } : stock
                          })()
                          return (
                          <div key={idx} className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${display.ticker === "KT" ? "bg-[#E60012]" : display.ticker === "SKT" ? "bg-neutral-800" : "bg-pink-600"}`}
                              >
                                {display.ticker}
                              </div>
                              <div>
                                <div className="font-semibold">{display.price.toLocaleString()}원</div>
                                <div
                                  className={`text-sm ${display.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {display.changePercent >= 0 ? "+" : ""}
                                  {display.changePercent}%
                                </div>
                              </div>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptyState
                        icon={BarChart3}
                        title="시장 데이터 없음"
                        description="통신 3사 데이터를 업로드해주세요"
                        actions={
                          <Button size="sm" variant="outline" onClick={() => (window.location.href = "/upload")}>
                            업로드하기
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </ClientErrorBoundary>

              <ClientErrorBoundary>
                <Card className="border-2 hover:border-[#E60012] transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-[#E60012]" />
                      여론 감성 지표
                    </CardTitle>
                    <CardDescription>커뮤니티 의견 분석</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {forumData.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{positiveCount}</div>
                            <div className="text-xs text-neutral-600">긍정</div>
                          </div>
                          <div className="p-3 bg-neutral-50 rounded-lg">
                            <div className="text-2xl font-bold text-neutral-600">{neutralCount}</div>
                            <div className="text-xs text-neutral-600">중립</div>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{negativeCount}</div>
                            <div className="text-xs text-neutral-600">부정</div>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {positiveCount > negativeCount
                            ? "전반적으로 긍정적인 여론"
                            : negativeCount > positiveCount
                              ? "부정적 의견 우세"
                              : "중립적 여론"}
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon={MessageSquare}
                        title="여론 데이터 없음"
                        description="포럼 데이터를 업로드해주세요"
                        actions={
                          <Button size="sm" variant="outline" onClick={() => (window.location.href = "/upload")}>
                            업로드하기
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </ClientErrorBoundary>
            </div>

            {/* Risk Alerts */}
            {(data?.sources?.news?.lines.some((line) => line.includes("보안") || line.includes("해킹")) ||
              data?.sources?.dart?.lines.some((line) => line.includes("공시"))) && (
              <Alert className="mb-8 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>리스크 알림:</strong> 보안 이슈 또는 중요 공시 관련 키워드가 감지되었습니다.
                </AlertDescription>
              </Alert>
            )}

            {/* Data Tabs */}
            <ClientErrorBoundary>
              <Tabs defaultValue="company" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
                  <TabsTrigger value="company" className="text-xs md:text-sm">
                    기업데이터
                  </TabsTrigger>
                  <TabsTrigger value="market" className="text-xs md:text-sm">
                    시장데이터
                  </TabsTrigger>
                  <TabsTrigger value="external" className="text-xs md:text-sm">
                    외부요인
                  </TabsTrigger>
                  <TabsTrigger value="sentiment" className="text-xs md:text-sm">
                    여론데이터
                  </TabsTrigger>
                  <TabsTrigger value="macro" className="text-xs md:text-sm">
                    매크로
                  </TabsTrigger>
                  <TabsTrigger value="internal" className="text-xs md:text-sm">
                    내부이벤트
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="company" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      {data?.sources?.dart ? (
                        <div className="space-y-2">
                          {data.sources.dart.lines.map((line, idx) => (
                            <div key={idx} className="text-sm">
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-neutral-500">기업 데이터 없음</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="market" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      {marketData.length > 0 ? (
                        <div className="space-y-4">
                          {marketData.map((stock, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                              <div>
                                <div className="font-semibold">{stock.ticker}</div>
                                <div className="text-sm text-neutral-600">{stock.volume}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{stock.price.toLocaleString()}원</div>
                                <div
                                  className={`text-sm ${stock.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {stock.changePercent >= 0 ? "+" : ""}
                                  {stock.changePercent}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-neutral-500">시장 데이터 없음</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="external" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-neutral-500">외부 요인 데이터 준비 중</div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sentiment" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      {forumData.length > 0 ? (
                        <div className="space-y-3">
                          {forumData.map((item, idx) => (
                            <div key={idx} className="p-4 bg-neutral-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">{item.platform}</Badge>
                                <Badge
                                  className={
                                    item.sentiment === "positive"
                                      ? "bg-green-500"
                                      : item.sentiment === "negative"
                                        ? "bg-red-500"
                                        : "bg-neutral-500"
                                  }
                                >
                                  {item.sentiment === "positive"
                                    ? "긍정"
                                    : item.sentiment === "negative"
                                      ? "부정"
                                      : "중립"}
                                </Badge>
                              </div>
                              <div className="text-sm">{item.content}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-neutral-500">여론 데이터 없음</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="macro" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-neutral-500">매크로 데이터 준비 중</div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="internal" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-neutral-500">내부 이벤트 데이터 준비 중</div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ClientErrorBoundary>

            {/* Weekly Insight Banner */}
            <Card className="bg-gradient-to-r from-[#E60012] to-red-700 text-white border-0 mt-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">주간 인사이트 리포트</h3>
                    <p className="text-white/90">전문가 분석과 AI 인사이트가 담긴 주간 리포트를 확인하세요</p>
                  </div>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-[#E60012] hover:bg-neutral-100"
                    onClick={() => (window.location.href = "/reports")}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    리포트 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
