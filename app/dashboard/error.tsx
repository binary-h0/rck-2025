"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-lg">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>대시보드 오류</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>대시보드를 불러오는 중 오류가 발생했습니다.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={reset}>
              <RefreshCw className="h-3 w-3 mr-1" />
              재시도
            </Button>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = "/")}>
              <ArrowLeft className="h-3 w-3 mr-1" />
              뒤로 가기
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
