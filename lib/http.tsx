"use client"

import { toast } from "@/hooks/use-toast"

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message)
    this.name = "FetchError"
  }
}

const DEFAULT_TIMEOUT = 8000

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchError("요청 시간이 초과되었습니다", 408, "TIMEOUT")
    }
    throw error
  }
}

export async function safeFetch<T = any>(url: string, options: RequestInit = {}, retries = 1): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new FetchError(
          errorData.error?.message || `HTTP ${response.status}`,
          response.status,
          errorData.error?.code,
        )
      }

      const data = await response.json()

      if (data.error) {
        throw new FetchError(data.error.message || "서버 오류", data.error.code)
      }

      return data
    } catch (error) {
      lastError = error as Error
      console.error(`[v0] Fetch attempt ${attempt + 1} failed:`, error)

      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 3000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  const errorMessage =
    lastError instanceof FetchError
      ? lastError.message
      : "데이터를 불러오지 못했어요. 오프라인이거나 서버 오류일 수 있어요."

  toast({
    title: "오류 발생",
    description: errorMessage,
    variant: "destructive",
    action: (
      <button
        onClick={() => {
          localStorage.setItem("safeMode", "1")
          window.location.reload()
        }}
        className="text-xs underline"
      >
        안전 모드
      </button>
    ),
  })

  throw lastError
}
