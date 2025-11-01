import { NextResponse } from "next/server"
import { bootstrapData } from "@/lib/bootstrap"

export const runtime = "nodejs"

let initialized = false

export async function GET() {
  if (!initialized) {
    try {
      await bootstrapData()
      initialized = true
      return NextResponse.json({ success: true, message: "Data initialized" })
    } catch (error) {
      console.error("[v0] Initialization error:", error)
      return NextResponse.json({ error: "Failed to initialize" }, { status: 500 })
    }
  }
  return NextResponse.json({ success: true, message: "Already initialized" })
}
