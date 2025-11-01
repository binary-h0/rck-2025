import { NextResponse } from "next/server"
import { clearCache, getCacheStats } from "@/lib/cache"

export const runtime = "nodejs"

export async function POST() {
  try {
    const statsBefore = getCacheStats()
    clearCache()
    const statsAfter = getCacheStats()

    return NextResponse.json({
      success: true,
      cleared: statsBefore.size,
      remaining: statsAfter.size,
    })
  } catch (error) {
    console.error("[v0] Error refreshing cache:", error)
    return NextResponse.json({ error: "Failed to refresh cache" }, { status: 500 })
  }
}
