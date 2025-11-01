"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Download, Plus, Calendar, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import type { ReportMetadata } from "@/lib/types"

export default function ReportsPage() {
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReport, setSelectedReport] = useState<{ content: string; metadata: ReportMetadata } | null>(null)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedKinds, setSelectedKinds] = useState<string[]>(["stock", "kt"])
  const { toast } = useToast()

  useEffect(() => {
    fetchDates()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchReports(selectedDate)
    }
  }, [selectedDate])

  async function fetchDates() {
    try {
      const res = await fetch("/api/dates")
      if (!res.ok) {
        console.error("[v0] Failed to fetch dates")
        setLoading(false)
        return
      }
      const json = await res.json()
      setDates(json.dates || [])
      if (json.dates && json.dates.length > 0) {
        setSelectedDate(json.dates[0])
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dates:", error)
      setLoading(false)
    }
  }

  async function fetchReports(date: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/report?date=${date}`)
      const json = await res.json()
      setReports(json.reports || [])
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewReport(report: ReportMetadata) {
    try {
      const res = await fetch(`/api/report/content?date=${report.date}&filename=${report.filename}`)
      const json = await res.json()

      if (res.ok) {
        setSelectedReport({
          content: json.content,
          metadata: report,
        })
      } else {
        toast({
          title: "오류",
          description: "리포트를 불러올 수 없습니다",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load report:", error)
      toast({
        title: "오류",
        description: "리포트 로딩 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  async function handleGenerateReports() {
    if (selectedKinds.length === 0) {
      toast({
        title: "오류",
        description: "최소 하나의 리포트 종류를 선택해주세요",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const res = await fetch("/api/report/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          kinds: selectedKinds,
        }),
      })

      const json = await res.json()

      if (res.ok) {
        toast({
          title: "생성 완료",
          description: `${json.generated.length}개의 리포트가 생성되었습니다`,
        })
        setShowGenerateDialog(false)
        await fetchReports(selectedDate)
      } else {
        toast({
          title: "생성 실패",
          description: json.error || "리포트 생성에 실패했습니다",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to generate reports:", error)
      toast({
        title: "오류",
        description: "리포트 생성 중 오류가 발생했습니다",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  function handleDownloadReport(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "다운로드 완료",
      description: `${filename} 파일이 다운로드되었습니다`,
    })
  }

  const reportKindOptions = [
    { value: "stock", label: "단기 전망 (Stock)", description: "내일 매수·매도 추이 예측" },
    { value: "kt", label: "주간 인사이트 (KT)", description: "종합 분석 및 투자 포인트" },
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
            <a href="/upload" className="text-sm font-medium hover:text-[#E60012] transition-colors">
              업로드
            </a>
            <a href="/reports" className="text-sm font-medium text-[#E60012]">
              리포트
            </a>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI 리포트</h1>
            <p className="text-neutral-600">데이터 기반 인사이트 리포트를 확인하세요</p>
          </div>
          <Button onClick={() => setShowGenerateDialog(true)} className="bg-[#E60012] hover:bg-[#E60012]/90">
            <Plus className="mr-2 h-4 w-4" />
            리포트 생성
          </Button>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-neutral-600 mb-2 block">날짜 선택</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#E60012] border-r-transparent" />
            <p className="mt-4 text-neutral-600">리포트 로딩 중...</p>
          </div>
        ) : reports.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.filename} className="border-2 hover:border-[#E60012] transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#E60012]" />
                    {report.kind === "stock" ? "단기 전망" : report.kind === "kt" ? "주간 인사이트" : report.kind}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {report.date}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline">{report.filename}</Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => handleViewReport(report)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">리포트가 없습니다</h3>
              <p className="text-neutral-600 mb-4">선택한 날짜에 생성된 리포트가 없습니다</p>
              <Button onClick={() => setShowGenerateDialog(true)} className="bg-[#E60012] hover:bg-[#E60012]/90">
                <Plus className="mr-2 h-4 w-4" />
                리포트 생성하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#E60012]" />
              리포트 생성
            </DialogTitle>
            <DialogDescription>생성할 리포트 종류를 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              {reportKindOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-neutral-50"
                >
                  <Checkbox
                    id={option.value}
                    checked={selectedKinds.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedKinds([...selectedKinds, option.value])
                      } else {
                        setSelectedKinds(selectedKinds.filter((k) => k !== option.value))
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </label>
                    <p className="text-xs text-neutral-500">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleGenerateReports}
              disabled={generating || selectedKinds.length === 0}
              className="w-full bg-[#E60012] hover:bg-[#E60012]/90"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  리포트 생성
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Viewer Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#E60012]" />
                {selectedReport?.metadata.kind === "stock"
                  ? "단기 전망"
                  : selectedReport?.metadata.kind === "kt"
                    ? "주간 인사이트"
                    : selectedReport?.metadata.kind}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  selectedReport && handleDownloadReport(selectedReport.content, selectedReport.metadata.filename)
                }
              >
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </Button>
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.metadata.date} • {selectedReport?.metadata.filename}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none py-4">
            <ReactMarkdown>{selectedReport?.content || ""}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
