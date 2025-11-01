import { NextResponse } from "next/server"
import { listDates } from "@/lib/fs"

export const runtime = "nodejs"

export async function GET() {
  try {
    const dates = await listDates()
    return NextResponse.json({ dates })
  } catch (error) {
    console.error("[v0] Error listing dates:", error)
    return NextResponse.json({ error: "Failed to list dates" }, { status: 500 })
  }
}
