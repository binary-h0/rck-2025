import { NextResponse } from "next/server"
import { readReport } from "@/lib/fs"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const filename = searchParams.get("filename")

    if (!date || !filename) {
      return NextResponse.json({ error: "Date and filename parameters required" }, { status: 400 })
    }

    const content = await readReport(date, filename)

    if (!content) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error("[v0] Error reading report:", error)
    return NextResponse.json({ error: "Failed to read report" }, { status: 500 })
  }
}
