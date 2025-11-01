"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Shield, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Global error:", error)
  }, [error])

  const isDev = process.env.NODE_ENV === "development"

  async function handleClearCache() {
    try {
      await fetch("/api/refresh-cache", { method: "POST" })
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }

  function handleSafeMode() {
    localStorage.setItem("safeMode", "1")
    window.location.href = "/?safe=1"
  }

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">⚠️ 문제가 발생했어요</CardTitle>
                  <CardDescription>일시적인 오류가 발생했습니다. 아래 조치로 복구를 시도하세요.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Button onClick={reset} className="w-full justify-start" size="lg">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  다시 시도
                </Button>
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  캐시 초기화 후 재시도
                </Button>
                <Button
                  onClick={handleSafeMode}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  안전 모드로 계속
                </Button>
                <Button onClick={() => (window.location.href = "/")} variant="ghost" className="w-full justify-start">
                  <Home className="mr-2 h-5 w-5" />
                  홈으로 이동
                </Button>
              </div>

              {isDev && (
                <details className="mt-4 p-4 bg-neutral-100 rounded-lg">
                  <summary className="cursor-pointer font-medium text-sm">자세히 보기 (개발 모드)</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-48 text-red-600">
                    {error.message}
                    {"\n\n"}
                    {error.stack?.split("\n").slice(0, 25).join("\n")}
                  </pre>
                </details>
              )}

              <p className="text-xs text-neutral-500 mt-4">
                문제가 계속되면 브라우저 캐시를 삭제하거나 다른 브라우저를 사용해보세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
