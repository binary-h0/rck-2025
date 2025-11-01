"use client"

import {
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Download,
  BarChart3,
  Newspaper,
  Target,
  Shield,
  Users,
  LineChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#E60012] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">KT</span>
            </div>
            <span className="font-bold text-xl">우리사주지키미</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              주요 기능
            </a>
            <a href="#insights" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              인사이트 리포트
            </a>
            <a href="#alerts" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              알림
            </a>
            <a href="/dashboard" className="text-sm font-medium hover:text-[#E60012] transition-colors">
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
            <Button variant="outline" size="sm">
              로그인
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge className="bg-[#E60012] hover:bg-[#E60012]/90 text-white">KT 임직원 전용</Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance">
              KT만 팬다.
              <br />
              <span className="text-[#E60012]">우리사주지키미</span>
            </h1>
            <p className="text-xl text-neutral-600 text-pretty">KT 임직원을 위한 자사주 투자 인텔리전스 플랫폼</p>
            <p className="text-neutral-500 text-pretty">
              실시간 주가 분석부터 AI 기반 트렌드 예측까지, 정확한 정보로 스마트한 투자 결정을 내리세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-[#E60012] hover:bg-[#E60012]/90 text-white"
                onClick={() => (window.location.href = "/dashboard")}
              >
                대시보드 미리보기
                <ArrowUpRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                소개 영상 보기
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-[#E60012]/10 to-neutral-100 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">KT 주가</span>
                  <Badge className="bg-green-500 text-white">+2.4%</Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">42,350원</div>
                  <div className="text-sm text-green-600">+1,000원 (2.4%)</div>
                </div>
                <div className="h-32 bg-gradient-to-r from-[#E60012]/20 to-green-500/20 rounded-lg flex items-end justify-around p-4">
                  {[40, 60, 45, 70, 55, 80, 75, 90].map((height, i) => (
                    <div key={i} className="w-2 bg-[#E60012] rounded-t" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="features" className="bg-neutral-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">실시간 투자 인텔리전스</h2>
            <p className="text-neutral-600 text-lg">모든 정보를 한눈에, 빠른 의사결정을 위한 통합 대시보드</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Real-time Stock Card */}
            <Card className="border-2 hover:border-[#E60012] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-[#E60012]" />
                  실시간 KT 주가
                </CardTitle>
                <CardDescription>현재가 및 거래량 정보</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">42,350원</div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      +1,000원 (2.4%)
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">상승</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-neutral-500">거래량</div>
                    <div className="font-semibold">1,234,567주</div>
                  </div>
                  <div>
                    <div className="text-neutral-500">거래대금</div>
                    <div className="font-semibold">523억원</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* News Summary Card */}
            <Card className="border-2 hover:border-[#E60012] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-[#E60012]" />
                  오늘의 KT 뉴스
                </CardTitle>
                <CardDescription>AI 요약 주요 뉴스</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">KT, AI 데이터센터 투자 확대</div>
                  <div className="text-xs text-neutral-500">긍정적 영향 예상 • 2시간 전</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">5G 가입자 1000만 돌파</div>
                  <div className="text-xs text-neutral-500">실적 개선 기대 • 5시간 전</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">클라우드 사업 매출 20% 증가</div>
                  <div className="text-xs text-neutral-500">긍정적 • 1일 전</div>
                </div>
              </CardContent>
            </Card>

            {/* Prediction Widget */}
            <Card className="border-2 hover:border-[#E60012] transition-colors bg-gradient-to-br from-[#E60012]/5 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#E60012]" />
                  내일 주가 예측
                </CardTitle>
                <CardDescription>AI 기반 트렌드 분석</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">상승 예상</div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">신뢰도</span>
                    <span className="font-semibold">78%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>
                <div className="text-xs text-neutral-500">긍정적 뉴스 흐름과 거래량 증가 패턴 감지</div>
              </CardContent>
            </Card>

            {/* Peer Comparison */}
            <Card className="border-2 hover:border-[#E60012] transition-colors md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#E60012]" />
                  통신 3사 비교
                </CardTitle>
                <CardDescription>KT vs SKT vs LGU+ 주가 성과</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E60012] rounded-lg flex items-center justify-center text-white font-bold">
                        KT
                      </div>
                      <div>
                        <div className="font-semibold">42,350원</div>
                        <div className="text-sm text-green-600">+2.4%</div>
                      </div>
                    </div>
                    <div className="w-1/2 bg-neutral-200 rounded-full h-3">
                      <div className="bg-[#E60012] h-3 rounded-full" style={{ width: "85%" }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center text-white font-bold">
                        SKT
                      </div>
                      <div>
                        <div className="font-semibold">58,200원</div>
                        <div className="text-sm text-green-600">+1.8%</div>
                      </div>
                    </div>
                    <div className="w-1/2 bg-neutral-200 rounded-full h-3">
                      <div className="bg-neutral-800 h-3 rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                        LG
                      </div>
                      <div>
                        <div className="font-semibold">35,800원</div>
                        <div className="text-sm text-red-600">-0.5%</div>
                      </div>
                    </div>
                    <div className="w-1/2 bg-neutral-200 rounded-full h-3">
                      <div className="bg-pink-600 h-3 rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Alerts */}
            <Card className="border-2 border-red-200 hover:border-red-400 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  리스크 알림
                </CardTitle>
                <CardDescription>주요 이슈 및 경고</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">공시 예정</div>
                    <div className="text-xs text-neutral-600">분기 실적 발표 D-3</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">시장 변동성 증가</div>
                    <div className="text-xs text-neutral-600">통신업 전반 주의</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Insight Banner */}
          <Card className="bg-gradient-to-r from-[#E60012] to-red-700 text-white border-0">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">주간 인사이트 리포트</h3>
                  <p className="text-white/90">전문가 분석과 AI 인사이트가 담긴 주간 리포트를 다운로드하세요</p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-[#E60012] hover:bg-neutral-100"
                  onClick={() => (window.location.href = "/reports")}
                >
                  <Download className="mr-2 h-5 w-5" />
                  리포트 다운로드
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Insight Tabs */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">다차원 데이터 분석</h2>
          <p className="text-neutral-600 text-lg">6가지 관점에서 KT를 분석합니다</p>
        </div>

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
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm text-neutral-500">매출액 (전년비)</div>
                    <div className="text-2xl font-bold">24.5조원</div>
                    <div className="text-sm text-green-600">+5.2%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-neutral-500">영업이익률</div>
                    <div className="text-2xl font-bold">8.3%</div>
                    <div className="text-sm text-green-600">+0.8%p</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-neutral-500">부채비율</div>
                    <div className="text-2xl font-bold">142%</div>
                    <div className="text-sm text-green-600">-8%p</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="market" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-neutral-500">시장 데이터 분석 정보가 여기에 표시됩니다</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="external" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-neutral-500">외부 요인 분석 정보가 여기에 표시됩니다</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sentiment" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-neutral-500">여론 데이터 분석 정보가 여기에 표시됩니다</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="macro" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-neutral-500">매크로 경제 분석 정보가 여기에 표시됩니다</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="internal" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-neutral-500">내부 이벤트 정보가 여기에 표시됩니다</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Data Sources Section */}
      <section id="insights" className="bg-neutral-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">신뢰할 수 있는 데이터 소스</h2>
            <p className="text-neutral-600 text-lg">다양한 채널에서 수집한 정보를 AI가 분석합니다</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              { name: "DART", desc: "전자공시" },
              { name: "네이버금융", desc: "시장 데이터" },
              { name: "Blind", desc: "내부 여론" },
              { name: "Reddit", desc: "글로벌 의견" },
              { name: "Twitter", desc: "실시간 반응" },
            ].map((source) => (
              <div
                key={source.name}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-neutral-400">📊</span>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{source.name}</div>
                  <div className="text-xs text-neutral-500">{source.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expected Impact Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">기대 효과</h2>
          <p className="text-neutral-600 text-lg">우리사주지키미가 만드는 변화</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-2 hover:border-[#E60012] transition-colors">
            <CardContent className="p-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">정확한 정보 기반 투자</h3>
              <p className="text-neutral-600">AI 분석과 실시간 데이터로 합리적인 투자 의사결정</p>
            </CardContent>
          </Card>
          <Card className="text-center border-2 hover:border-[#E60012] transition-colors">
            <CardContent className="p-8 space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">자사주 참여 확대</h3>
              <p className="text-neutral-600">투명한 정보 제공으로 임직원 참여율 증가</p>
            </CardContent>
          </Card>
          <Card className="text-center border-2 hover:border-[#E60012] transition-colors">
            <CardContent className="p-8 space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold">건전한 투자 문화 조성</h3>
              <p className="text-neutral-600">체계적인 정보 제공으로 합리적 투자 문화 정착</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer id="alerts" className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#E60012] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">KT</span>
                </div>
                <span className="font-bold text-xl">우리사주지키미</span>
              </div>
              <p className="text-neutral-400 text-sm">KT 임직원을 위한 자사주 투자 인텔리전스 플랫폼</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">문의</h4>
              <p className="text-neutral-400 text-sm">
                이메일: support@kt-stock.com
                <br />
                내선: 1234-5678
              </p>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-8 space-y-4">
            <p className="text-xs text-neutral-500">
              <strong className="text-[#E60012]">⚠️ 투자 유의사항</strong>
              <br />본 서비스는 KT 임직원 전용 정보 제공 플랫폼입니다. 제공되는 정보는 투자 판단의 참고 자료이며, 투자
              결과에 대한 책임은 투자자 본인에게 있습니다. 과거 데이터 및 AI 예측은 미래 수익을 보장하지 않습니다.
            </p>
            <p className="text-xs text-neutral-500">
              © 2025 KT Corporation. All rights reserved. KT 내부 전용 서비스입니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
