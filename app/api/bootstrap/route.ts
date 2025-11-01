import { NextResponse } from "next/server"
import { bootstrapData } from "@/lib/bootstrap"

export const runtime = "nodejs"

let initialized = false

export async function POST() {
  if (!initialized) {
    try {
      console.log("[v0] Starting bootstrap process...")
      await bootstrapData()
      initialized = true
      console.log("[v0] Bootstrap completed successfully")
      return NextResponse.json({ success: true, message: "Data initialized" })
    } catch (error) {
      console.error("[v0] Bootstrap error details:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return NextResponse.json(
        {
          error: "Failed to initialize",
          details: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      )
    }
  }
  return NextResponse.json({ success: true, message: "Already initialized" })
}
