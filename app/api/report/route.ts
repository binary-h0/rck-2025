import { NextResponse } from "next/server"
import { listReports } from "@/lib/fs"
import type { ReportMetadata } from "@/lib/types"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
    }

    const files = await listReports(date)
    const reports: ReportMetadata[] = []

    for (const filename of files) {
      const kind = filename.replace(".md", "")

      reports.push({
        date,
        filename,
        kind,
        path: `/report/${date}/${filename}`,
      })
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("[v0] Error listing reports:", error)
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 })
  }
}
