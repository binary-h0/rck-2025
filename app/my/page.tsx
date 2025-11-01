"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart as ReLineChart, Line, CartesianGrid, XAxis, YAxis, ReferenceLine, BarChart as ReBarChart, Bar } from "recharts"
import { TrendingUp, Shield, Target, Bell, Calculator, CalendarDays } from "lucide-react"

type Holding = {
  date: string
  shares: number
  price: number
}

type DailyPoint = { date: string; KT?: number; SKT?: number; LG?: number }

export default function MyPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [newDate, setNewDate] = useState("")
  const [newShares, setNewShares] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [history, setHistory] = useState<DailyPoint[] | null>(null)
  const [salary, setSalary] = useState<{ month: string; gross: number }[]>([])
  const [annualContribution, setAnnualContribution] = useState<number>(2400000)
  const [withdrawalDate, setWithdrawalDate] = useState<string>("")
  const [marketPrice, setMarketPrice] = useState<number>(48000)
  const [loadedHoldings, setLoadedHoldings] = useState<{ acqDate: string; price: number; shares: number; method: string }[]>([])
  const [law, setLaw] = useState<{ incomeTax?: any; withholdingRelief?: any }>({})
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null)
  const [dividends, setDividends] = useState<{ date: string; amount: number; shares?: number; perShare?: number }[]>([])

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/market/history?tickers=KT&range=12mo")
        if (!r.ok) throw new Error("history http error")
        const j = await r.json()
        setHistory(j.data)
      } catch (e) {
        // API 실패 시 가짜 데이터 생성 (랜덤 워크)
        const mock = generateMockHistory(250)
        setHistory(mock)
      }
    }
    load()
  }, [])

  useEffect(() => {
    async function loadMy() {
      const s = await fetch("/api/my/salary").then((r) => r.json()).catch(() => ({ months: [] }))
      setSalary(s.months || [])
      const h = await fetch("/api/my/holdings").then((r) => r.json()).catch(() => ({ holdings: [] }))
      setLoadedHoldings(h.holdings || [])
      const d = await fetch("/api/my/dividends").then((r) => r.json()).catch(() => ({ dividends: [] }))
      setDividends(d.dividends || [])
    }
    loadMy()
  }, [])

  useEffect(() => {
    async function loadLaw() {
      const res = await fetch("/api/law").then((r) => r.json()).catch(() => ({}))
      setLaw(res)
    }
    loadLaw()
  }, [])

  // 과거 1년 주가가 없으면 1년 히스토리 로드 (KT)
  useEffect(() => {
    if (history && history.length >= 5) return
    fetch("/api/market/history?tickers=KT&range=12mo")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data) setHistory(j.data)
      })
      .catch(() => {})
  }, [history])

  // 기본 인출일/시장가 초기화 (현재 일자/현재가)
  useEffect(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    if (!withdrawalDate) setWithdrawalDate(`${yyyy}-${mm}-${dd}`)
    fetch("/api/market")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.price) setMarketPrice(j.data.price)
      })
      .catch(() => {})
  }, [])

  function handleAIPredictPrice() {
    try {
      if (!history || history.length < 2) return
      const prices = history.map((d) => d.KT || 0).filter((v) => v > 0)
      if (prices.length < 2) return
      const lastP = prices[prices.length - 1]
      const rets: number[] = []
      for (let i = 1; i < prices.length; i++) {
        const p0 = prices[i - 1]
        const p1 = prices[i]
        if (p0 > 0 && p1 > 0) rets.push(Math.log(p1 / p0))
      }
      let meanDaily = 0
      if (rets.length >= 5) {
        meanDaily = rets.reduce((s, r) => s + r, 0) / rets.length
      }
      const muM = meanDaily * 21
      const nextMonth = Math.max(1, Math.round(lastP * Math.exp(muM)))
      setPredictedPrice(nextMonth)
      setMarketPrice(nextMonth)
    } catch {}
  }

  function generateMockHistory(days: number): DailyPoint[] {
    const out: DailyPoint[] = []
    let price = 45000
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      // 소폭 변동
      const drift = (Math.sin(i / 12) + Math.cos(i / 18)) * 15
      const noise = (Math.random() - 0.5) * 40
      price = Math.max(10000, Math.round(price + drift + noise))
      out.push({ date: `${yyyy}-${mm}-${dd}`, KT: price })
    }
    return out
  }

  const portfolioValue = useMemo(() => {
    if (!history || history.length === 0) return [] as { date: string; value: number }[]
    const totalShares = holdings.reduce((s, h) => s + h.shares, 0)
    return history.map((d) => ({ date: d.date, value: (d.KT || 0) * totalShares }))
  }, [history, holdings])

  const breakEven = useMemo(() => {
    const totalCost = holdings.reduce((s, h) => s + h.shares * h.price, 0)
    const totalShares = holdings.reduce((s, h) => s + h.shares, 0)
    if (totalShares === 0) return 0
    return Math.round(totalCost / totalShares)
  }, [holdings])

  const lastClose = useMemo(() => {
    if (!history || history.length === 0) return 0
    const last = history[history.length - 1]
    return last.KT || 0
  }, [history])

  // --- 1) 출연금액(연) 시뮬레이션 ---
  const taxSim = useMemo(() => {
    const totalIncome = salary.reduce((s, m) => s + (m.gross || 0), 0)
    function calcTax(base: number): number {
      const brackets = law.incomeTax?.brackets || [
        { upTo: 14000000, rate: 0.06 },
        { upTo: 50000000, rate: 0.15 },
        { upTo: 88000000, rate: 0.24 },
        { upTo: null, rate: 0.24 },
      ]
      let tax = 0
      let prev = 0
      for (const b of brackets) {
        const cap = b.upTo === null ? base : Math.min(base, b.upTo)
        if (cap > prev) {
          tax += (cap - prev) * b.rate
          prev = cap
        }
        if (prev >= base) break
      }
      return tax
    }
    const original = Math.round(calcTax(totalIncome))
    const deductedBase = Math.max(0, totalIncome - annualContribution)
    const after = Math.round(calcTax(deductedBase))
    const saving = Math.max(0, original - after)
    return { totalIncome, original, after, saving }
  }, [salary, annualContribution, law])

  // --- 2) 인출 세금 시뮬레이션 ---
  function hasPassedObligation(acqDate: string, withdrawDate: string): boolean {
    const years = law.withholdingRelief?.obligationYears ?? 2
    const a = new Date(acqDate)
    const w = new Date(withdrawDate)
    const diffDays = (w.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays >= 365 * years
  }

  function reliefRate(method: string, acqDate: string, withdrawDate: string): number {
    const a = new Date(acqDate)
    const w = new Date(withdrawDate)
    const diffYears = (w.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 365)
    const rels = law.withholdingRelief?.reliefs || [
      { minYears: 0, maxYears: 2, rate: 0.0 },
      { minYears: 2, maxYears: 4, rate: 0.5 },
      { minYears: 4, maxYears: null, rate: 0.75 },
    ]
    const found = rels.find((r: any) => diffYears >= r.minYears && (r.maxYears === null || diffYears < r.maxYears))
    return found ? found.rate : 0
  }

  function yearsBetween(a: string, b: string): number {
    const da = new Date(a)
    const db = new Date(b)
    return (db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24 * 365)
  }

  function nextMilestone(acqDate: string, asOf: string): { targetYears: number; targetDate: string } | null {
    const y = yearsBetween(acqDate, asOf)
    const targetYears = y < 2 ? 2 : y < 4 ? 4 : 4
    if (y >= 4) return null
    const d0 = new Date(acqDate)
    const targetDate = new Date(d0.getTime())
    targetDate.setFullYear(d0.getFullYear() + targetYears)
    const yyyy = targetDate.getFullYear()
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0")
    const dd = String(targetDate.getDate()).padStart(2, "0")
    return { targetYears, targetDate: `${yyyy}-${mm}-${dd}` }
  }

  const withdrawalSim = useMemo(() => {
    if (!withdrawalDate || loadedHoldings.length === 0) return null as null | {
      totalTax: number
      potentialSaving: number
      rows: Array<{ acqDate: string; method: string; shares: number; taxBasis: number; grossGain: number; reliefRate: number; reliefApplied: number; taxableBase: number; estTax: number; passed: boolean; yearsHeld: number; milestone?: { targetYears: number; targetDate: string; extraSaving: number } }>
    }
    const rows: any[] = []
    let sumTax = 0
    let sumReliefPotential = 0
    let sumNextSaving = 0
    // 최근 1개월(영업일 21일 가정) 평균 종가
    let lastMonthAvg = marketPrice
    try {
      if (history && history.length > 0) {
        const series = history
          .map((d) => d.KT)
          .filter((v) => typeof v === "number") as number[]
        const slice = series.slice(-21)
        if (slice.length > 0) {
          lastMonthAvg = Math.round(slice.reduce((s, v) => s + v, 0) / slice.length)
        }
      }
    } catch {}
    for (const h of loadedHoldings) {
      const passed = hasPassedObligation(h.acqDate, withdrawalDate)
      const taxBasis = Math.min(h.price, lastMonthAvg)
      const gainPerShare = Math.max(0, marketPrice - taxBasis)
      const grossGain = gainPerShare * h.shares
      const rate = reliefRate(h.method, h.acqDate, withdrawalDate)
      const reliefApplied = Math.round(taxBasis * h.shares * rate)
      const taxable = Math.max(0, Math.round(taxBasis * h.shares * (1 - rate)))
      const baseRate = law.withholdingRelief?.employmentIncomeTaxRate ?? 0.15
      const estTax = Math.round(taxable * baseRate)
      sumTax += estTax
      sumReliefPotential += reliefApplied * baseRate
      const yHeld = yearsBetween(h.acqDate, withdrawalDate)
      let milestone
      const nm = nextMilestone(h.acqDate, withdrawalDate)
      if (nm) {
        const futureRate = nm.targetYears >= 4 ? 0.75 : 0.5
        const futureRelief = Math.round(taxBasis * h.shares * futureRate)
        const extraRelief = Math.max(0, futureRelief - reliefApplied)
        const extraSaving = Math.round(extraRelief * baseRate)
        sumNextSaving += extraSaving
        milestone = { targetYears: nm.targetYears, targetDate: nm.targetDate, extraSaving }
      }
      rows.push({ acqDate: h.acqDate, method: h.method, shares: h.shares, taxBasis, grossGain, reliefRate: rate, reliefApplied, taxableBase: taxable, estTax, passed, yearsHeld: yHeld, milestone })
    }
    return { totalTax: sumTax, potentialSaving: Math.round(sumReliefPotential), rows, totalNextSaving: sumNextSaving }
  }, [withdrawalDate, loadedHoldings, marketPrice, history])

  // 세제혜택 예시(가정치): 보유기간별 과세율(예시)
  const taxBars = useMemo(() => {
    const totalShares = holdings.reduce((s, h) => s + h.shares, 0)
    const gainPerShare = Math.max(0, (lastClose || 0) - (breakEven || 0))
    const gain = Math.max(1_000_000, Math.round(gainPerShare * totalShares)) // 최소 100만원 가정
    const cases = [
      { label: "1년 미만", rate: 0.22 },
      { label: "1~2년", rate: 0.15 },
      { label: "3년+", rate: 0.09 },
    ]
    return cases.map((c) => ({ 구간: c.label, 세액: Math.round(gain * c.rate) }))
  }, [holdings, breakEven, lastClose])

  // DCA vs 일시매수 시뮬레이션
  const [budget, setBudget] = useState("10000000")
  const dcaSeries = useMemo(() => {
    if (!history || history.length === 0) return null as null | { date: string; LumpSum: number; DCA: number }[]
    const prices = history.map((d) => ({ date: d.date, close: d.KT || 0 }))
    const total = Number(budget || "0") || 0
    if (total <= 0) return prices.map((p) => ({ date: p.date, LumpSum: 0, DCA: 0 }))
    // LumpSum at day 0
    const first = prices[0].close || 1
    const lumpShares = total / first
    let dcaShares = 0
    const periods = 12 // 12개 구간 (월별 유사)
    const per = total / periods
    const result: { date: string; LumpSum: number; DCA: number }[] = []
    prices.forEach((p, idx) => {
      // 매 21거래일마다 분할매수(약 월 1회)
      if (idx % 21 === 0) {
        const buyPrice = p.close || 1
        dcaShares += per / buyPrice
      }
      result.push({ date: p.date, LumpSum: Math.round(lumpShares * p.close), DCA: Math.round(dcaShares * p.close) })
    })
    return result
  }, [history, budget])

  // --- 3) 인출 시뮬레이션: 5년(60개월) 예측 시계열 (과거 변동성 기반, 기대경로) ---
  const esopForecast = useMemo(() => {
    if (!history || history.length < 5) return null as null | { date: string; price: number; withEsop: number; withoutEsop: number }[]
    const dailyPrices = history
      .map((d) => d.KT)
      .filter((v) => typeof v === "number") as number[]
    if (dailyPrices.length < 5) return null
    const lastP = dailyPrices[dailyPrices.length - 1]
    // 로그수익률 기반 변동성 추정(최소 요건 미달 시 기본값 사용)
    const rets: number[] = []
    for (let i = 1; i < dailyPrices.length; i++) {
      const p0 = dailyPrices[i - 1]
      const p1 = dailyPrices[i]
      if (p0 > 0 && p1 > 0) rets.push(Math.log(p1 / p0))
    }
    let meanDaily = 0
    let sigmaDaily = 0.01 // 기본 일간 변동성(1%)
    if (rets.length >= 5) {
      meanDaily = rets.reduce((s, r) => s + r, 0) / rets.length
      const varDaily = rets.reduce((s, r) => s + Math.pow(r - meanDaily, 2), 0) / rets.length
      sigmaDaily = Math.sqrt(varDaily)
    }
    // 월간 파라미터(영업일 21일 가정)
    const muM = meanDaily * 21
    const sigmaM = sigmaDaily * Math.sqrt(21)
    const months = 60
    const monthlyContribution = Math.max(0, Math.round((annualContribution || 0) / 12))
    let price = lastP
    let cumContrib = 0
    // 기존 보유 주식 수
    let shares = loadedHoldings.reduce((s, h) => s + (h.shares || 0), 0)
    const out: { date: string; price: number; withEsop: number; withoutEsop: number }[] = []
    const now = new Date()
    for (let m = 1; m <= months; m++) {
      // 기대 경로(Z=0)
      price = Math.max(1, Math.round(price * Math.exp(muM - 0.5 * sigmaM * sigmaM)))
      // 분할매수: 해당 월에 출연금으로 주식 매수
      if (monthlyContribution > 0) {
        const addShares = monthlyContribution / price
        shares += addShares
        cumContrib += monthlyContribution
      }
      const withEsop = Math.round(shares * price)
      const withoutEsop = cumContrib // 현금 보유 가정(0% 수익)
      const d = new Date(now.getTime())
      d.setMonth(d.getMonth() + m)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      out.push({ date: `${yyyy}-${mm}`, price, withEsop, withoutEsop })
    }
    return out
  }, [history, annualContribution, loadedHoldings])

  function addHolding() {
    if (!newDate || !newShares || !newPrice) return
    setHoldings((prev) => [
      ...prev,
      { date: newDate, shares: Number(newShares), price: Number(newPrice) },
    ])
    setNewDate("")
    setNewShares("")
    setNewPrice("")
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#E60012] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">KT</span>
            </div>
            <span className="font-bold text-xl">My우리사주</span>
            <Badge variant="outline" className="ml-2">BETA</Badge>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium hover:text-[#E60012] transition-colors">홈</a>
            <a href="/dashboard" className="text-sm font-medium hover:text-[#E60012] transition-colors">대시보드</a>
            <a href="/my" className="text-sm font-medium text-[#E60012]">My우리사주</a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 1) 우리사주 출연금액 시뮬레이션 */}
        <Card className="border-2 md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-[#E60012]" />우리사주 출연금액 시뮬레이션</CardTitle>
            <CardDescription>연간 출연금액 선택 및 월 급여 JSON 로드 기반 세액 추정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm text-neutral-600">연 출연금액</label>
                <select className="px-3 py-2 border rounded-lg bg-white w-full" value={annualContribution} onChange={(e) => setAnnualContribution(Number(e.target.value))}>
                  {[1200000,2400000,3000000,3400000,4000000].map(v => (
                    <option key={v} value={v}>{v.toLocaleString()}원</option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <div className="w-full text-neutral-500">2025년 총 연봉(추정)금액</div>
                <div className="font-bold text-2xl">{taxSim.totalIncome.toLocaleString()}원</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-neutral-500">추정 세액(원)</div>
                <div className="font-semibold">{taxSim.original.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-neutral-500">공제 후 세액(원)</div>
                <div className="font-semibold">{taxSim.after.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-neutral-500">예상 절감액(원)</div>
                <div className="font-semibold text-green-600">{taxSim.saving.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-xs text-neutral-500">
            “이 시뮬레이션은 단순화된 소득세율 기준이며, 신용카드 사용, 의료비, 교육비, 기부금 등 기타 공제 항목은 제외됩니다. 실제 환급액은 달라질 수 있습니다.”
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-[#E60012]" /> 예측/신호 & 매수·매도 시점</CardTitle>
            <CardDescription>간단한 이동평균(5/20) 교차로 신호를 시각화합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history && history.length > 0 ? (
              <ChartContainer id="kt-signal" className="w-full h-64" config={{
                KT: { label: "KT 종가", color: "#E60012" },
                MA5: { label: "MA5", color: "#10b981" },
                MA20: { label: "MA20", color: "#6366f1" },
              }}>
                <ReLineChart data={history.map((d, i, arr) => {
                  const close = d.KT || 0
                  const ma5 = i >= 4 ? arr.slice(i-4, i+1).reduce((s, x) => s + (x.KT || 0), 0)/5 : undefined
                  const ma20 = i >= 19 ? arr.slice(i-19, i+1).reduce((s, x) => s + (x.KT || 0), 0)/20 : undefined
                  return { ...d, MA5: ma5, MA20: ma20 }
                })} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={20} />
                  <YAxis width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="KT" stroke="var(--color-KT)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="MA5" stroke="var(--color-MA5)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="MA20" stroke="var(--color-MA20)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </ReLineChart>
              </ChartContainer>
            ) : (
              <div className="text-sm text-neutral-500">일별 데이터 로드 중이거나 데이터가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-[#E60012]" /> 기타 활용</CardTitle>
            <CardDescription>목표가/손절가 알림, 리밸런싱 리마인더, 자동 저장 등</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-700">
            <div>• 목표가/손절가를 설정하고 도달 시 알림을 받을 수 있게 준비합니다.</div>
            <div>• 월 1회 리밸런싱 리마인더 메일/푸시(추후 설정 페이지) 제공합니다.</div>
            <div>• 입력한 보유 정보는 로컬 저장(브라우저 저장소)으로 우선 지원합니다.</div>
          </CardContent>
        </Card>
        {/* 2) 우리사주 인출 세금 시뮬레이션 */}
        <Card className="border-2 md:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-[#E60012]" /> 우리사주 인출 세금 시뮬레이션</CardTitle>
            <CardDescription>
              과세 기준 금액: 매입단가 vs 인출일 기준 최근 1개월 종가 평균 중 낮은 금액<br />
              감면 기준: 보유 기간(취득일부터 인출일까지)에 따라 적용<br />
              - 2년 미만: 감면 없음 / 2~4년: 50% 감면 / 4년 이상: 75% 감면
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-sm text-neutral-600">인출일</label>
                <input type="date" className="px-3 py-2 border rounded-lg bg-white w-full" value={withdrawalDate} onChange={(e) => setWithdrawalDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600">시장가(원)</label>
                <input type="number" className="px-3 py-2 border rounded-lg bg-white w-full" value={marketPrice} onChange={(e) => setMarketPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-neutral-600">AI 예측 시장가(다음달)</label>
                <div className="text-sm font-semibold">{predictedPrice ? predictedPrice.toLocaleString() + "원" : "-"}</div>
              </div>
              <div className="flex">
                <Button className="ml-auto" variant="outline" onClick={handleAIPredictPrice}>AI 시장가 예측</Button>
              </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500">
                    <th className="py-2">취득일</th>
                    <th className="py-2">방법</th>
                    <th className="py-2">수량</th>
                    <th className="py-2">과세 기준 금액(원)</th>
                    <th className="py-2">총 이익(원)</th>
                    <th className="py-2">감면율</th>
                    <th className="py-2">감면액</th>
                    <th className="py-2">과세 대상(원)</th>
                    <th className="py-2">예상세액</th>
                    <th className="py-2">의무예탁</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalSim?.rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1">{r.acqDate}</td>
                      <td className="py-1">{r.method}</td>
                      <td className="py-1">{r.shares.toLocaleString()}</td>
                      <td className="py-1">{r.taxBasis.toLocaleString()}원</td>
                      <td className="py-1">{r.grossGain.toLocaleString()}원</td>
                      <td className="py-1">{Math.round(r.reliefRate * 100)}%</td>
                      <td className="py-1">{r.reliefApplied.toLocaleString()}원</td>
                      <td className="py-1">{r.taxableBase.toLocaleString()}원</td>
                      <td className="py-1">{r.estTax.toLocaleString()}원</td>
                      <td className="py-1">{r.passed ? "통과" : "미통과"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-neutral-500">총 예상 세액</div>
                <div className="font-semibold">{withdrawalSim ? withdrawalSim.totalTax.toLocaleString() : "-"}</div>
              </div>
              <div>
                <div className="text-neutral-500">보유연장 시 절감 잠재액</div>
                <div className="font-semibold text-green-600">{withdrawalSim ? withdrawalSim.potentialSaving.toLocaleString() : "-"}</div>
              </div>
              
            </div>
            {/* 간단한 타임라인 요약 */}
            {/* <div className="text-xs text-neutral-600">
              {withdrawalSim?.rows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-medium">{r.acqDate}</span>
                  <span>보유 {r.yearsHeld.toFixed(2)}년</span>
                  {r.milestone ? (
                    <span>→ {r.milestone.targetYears}년({r.milestone.targetDate}) 도달 시 추가 절감 {r.milestone.extraSaving.toLocaleString()}원</span>
                  ) : (
                    <span>(최대 감면 구간 도달)</span>
                  )}
                </div>
              ))}
            </div> */}
          </CardContent>
        </Card>
        
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#E60012]" /> 보유 우리사주 입력</CardTitle>
            <CardDescription>보유 수량/평단을 입력하면 가치 변동·손익분기선을 시각화합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-neutral-600">매수일(YYYY-MM-DD)</label>
                <Input placeholder="2025-01-15" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600">수량(주)</label>
                <Input placeholder="100" value={newShares} onChange={(e) => setNewShares(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-neutral-600">평단가(원)</label>
                <Input placeholder="42000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={addHolding}>추가</Button>
              </div>
            </div>
            <div className="text-sm text-neutral-600">보유 건수: {holdings.length}건 • 손익분기: <span className="font-semibold">{breakEven.toLocaleString()}원</span></div>
            <div className="text-sm text-neutral-600">
              지금까지 받은 배당금 합계: <span className="font-semibold">{dividends.reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()}원</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500">
                    <th className="py-2">지급일</th>
                    <th className="py-2">배당금(원)</th>
                    <th className="py-2">보유수량</th>
                    <th className="py-2">주당(원)</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1">{d.date}</td>
                      <td className="py-1">{(d.amount || 0).toLocaleString()}원</td>
                      <td className="py-1">{d.shares ? d.shares.toLocaleString() : "-"}</td>
                      <td className="py-1">{d.perShare ? d.perShare.toLocaleString() + "원" : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-lg p-2">
              <ChartContainer id="my-holdings" className="w-full h-64" config={{
                VALUE: { label: "가치(원)", color: "#0ea5e9" },
                KT: { label: "KT 종가", color: "#E60012" },
              }}>
                <ReLineChart data={portfolioValue} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={20} />
                  <YAxis width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-VALUE)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <ReferenceLine y={breakEven} stroke="#64748b" strokeDasharray="4 4" />
                </ReLineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#E60012]" /> 세제혜택 시각화</CardTitle>
            <CardDescription>보유기간별 과세액(예시)을 가정하여 비교합니다. 실제 적용은 사규/세법 기준을 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-2">
              <ChartContainer id="tax-bars" className="w-full h-64" config={{ TAX: { label: "세액(원)", color: "#f59e0b" } }}>
                <ReBarChart data={taxBars} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="구간" />
                  <YAxis width={70} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="세액" fill="var(--color-TAX)" />
                </ReBarChart>
              </ChartContainer>
            </div>
            <div className="text-xs text-neutral-500">예시 과세율: 1년 미만 22%, 1~2년 15%, 3년+ 9% (샘플)</div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-[#E60012]" /> DCA vs 일시매수 시뮬레이션</CardTitle>
            <CardDescription>12개월 구간에서 분할매수(DCA)와 일시매수 성과를 비교합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-neutral-600">총 투자금(원)</label>
                <Input placeholder="10000000" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
            </div>
            {dcaSeries ? (
              <div className="bg-white rounded-lg p-2">
                <ChartContainer id="dca-lump" className="w-full h-64" config={{ LUMP: { label: "일시매수", color: "#0ea5e9" }, DCA: { label: "분할매수", color: "#10b981" } }}>
                  <ReLineChart data={dcaSeries} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" minTickGap={20} />
                    <YAxis width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="LumpSum" stroke="var(--color-LUMP)" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="DCA" stroke="var(--color-DCA)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </ReLineChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-sm text-neutral-500">시뮬레이션 준비 중...</div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}


