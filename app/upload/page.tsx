"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function UploadPage() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedSource, setSelectedSource] = useState<string>("dart")
  const [content, setContent] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDates()
  }, [])

  async function fetchDates() {
    try {
      const res = await fetch("/api/dates")
      if (!res.ok) {
        console.error("[v0] Failed to fetch dates")
        return
      }
      const json = await res.json()
      setDates(json.dates || [])
      if (json.dates && json.dates.length > 0) {
        setSelectedDate(json.dates[0])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dates:", error)
    }
  }

  async function handleUpload() {
    if (!content.trim()) {
      toast({
        title: "오류",
        description: "내용을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setPreview(null)

    try {
      const res = await fetch(`/api/upload?date=${selectedDate}&source=${selectedSource}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: content,
      })

      const json = await res.json()

      if (res.ok) {
        setPreview(json.preview)
        toast({
          title: "업로드 성공",
          description: `${selectedSource}.txt 파일이 저장되었습니다`,
        })
      } else {
        toast({
          title: "업로드 실패",
          description: json.error || "파일 업로드에 실패했습니다",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "오류",
        description: "업로드 중 오류가 발생했습니다",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && file.type === "text/plain") {
      const text = await file.text()
      setContent(text)
      toast({
        title: "파일 로드 완료",
        description: `${file.name} 파일을 불러왔습니다`,
      })
    } else {
      toast({
        title: "오류",
        description: ".txt 파일만 업로드 가능합니다",
        variant: "destructive",
      })
    }
  }

  const sourceOptions = [
    { value: "dart", label: "DART (전자공시)", example: "매출, 영업이익, CAPEX 등" },
    { value: "news", label: "뉴스", example: "[시간] 출처 | 제목" },
    { value: "forum", label: "포럼/커뮤니티", example: "[플랫폼] 내용 (긍정/중립/부정)" },
    { value: "market", label: "시장 데이터", example: "티커: 가격 (등락률) | 거래량" },
    { value: "custom", label: "커스텀", example: "자유 형식" },
  ]

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
          </div>
          <nav className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              홈
            </a>
            <a href="/dashboard" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              대시보드
            </a>
            <a href="/upload" className="text-sm font-medium text-[#E60012]">
              업로드
            </a>
            <a href="/reports" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              리포트
            </a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">데이터 업로드</h1>
          <p className="text-neutral-600">새로운 데이터를 업로드하여 대시보드에 반영하세요</p>
        </div>

        <div className="grid gap-6">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <CardTitle>파일 업로드</CardTitle>
              <CardDescription>날짜와 소스를 선택한 후 데이터를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date">날짜 선택</Label>
                <select
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                >
                  {dates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Selection */}
              <div className="space-y-2">
                <Label htmlFor="source">데이터 소스</Label>
                <select
                  id="source"
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                >
                  {sourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500">
                  예시 형식: {sourceOptions.find((o) => o.value === selectedSource)?.example}
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">파일 선택 (선택사항)</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="file"
                    type="file"
                    accept=".txt"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E60012] file:text-white hover:file:bg-[#E60012]/90"
                  />
                </div>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <Label htmlFor="content">데이터 내용</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="데이터를 입력하거나 붙여넣기 하세요..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-neutral-500">각 줄은 하나의 데이터 항목으로 처리됩니다</p>
              </div>

              {/* Upload Button */}
              <Button onClick={handleUpload} disabled={uploading} className="w-full bg-[#E60012] hover:bg-[#E60012]/90">
                {uploading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    업로드
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          {preview && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  업로드 완료
                </CardTitle>
                <CardDescription className="text-green-700">파일이 성공적으로 저장되었습니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedDate}/{selectedSource}.txt
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold mb-2 text-sm text-neutral-700">파싱 미리보기</h4>
                  <pre className="text-xs text-neutral-600 overflow-auto max-h-[200px]">
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>대시보드를 새로고침하면 업데이트된 데이터를 확인할 수 있습니다.</AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  대시보드로 이동
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>데이터 형식 가이드</CardTitle>
              <CardDescription>각 소스별 권장 형식</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">DART (전자공시)</h4>
                <pre className="text-xs bg-neutral-100 p-3 rounded-lg overflow-auto">
                  {`2025Q3 매출 6.12조(+3.1% YoY), 영업이익 4,150억(+2.3% YoY)
5G CAPEX 8,200억 집행, 인건비 전년동기비 +1.2%
자사주 보유 1.2% (변동없음)`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">뉴스</h4>
                <pre className="text-xs bg-neutral-100 p-3 rounded-lg overflow-auto">
                  {`[09:10] 파이낸셜뉴스 | KT, AI센터 확대… B2B 수주 확대 기대
[11:35] 전자공시 | 최대주주 변동 없음 공시
[13:05] 블룸버그 | 통신 3사, ARPU 회복세`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">포럼/커뮤니티</h4>
                <pre className="text-xs bg-neutral-100 p-3 rounded-lg overflow-auto">
                  {`[Blind] 실적 무난, 배당 기대 ↑ (긍정)
[종토방] 단기 반등 이후 숨고르기 (중립)
[Reddit] Korea telcos undervalued thesis (긍정)`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">시장 데이터</h4>
                <pre className="text-xs bg-neutral-100 p-3 rounded-lg overflow-auto">
                  {`KT: 36,500 (+0.8%) | 거래량 2.1M
SKT: 56,800 (+0.4%) | 거래량 1.3M
LGU+: 9,850 (+0.3%) | 거래량 0.9M`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
