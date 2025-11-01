"use client"

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ClientErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] Error boundary caught:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>이 위젯에서 오류가 발생했습니다</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm">{this.state.error?.message || "알 수 없는 오류"}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
                <RefreshCw className="h-3 w-3 mr-1" />
                재시도
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  localStorage.setItem("safeMode", "1")
                  window.location.reload()
                }}
              >
                안전 모드
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}
