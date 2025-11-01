import { NextResponse } from "next/server"
import { writeSourceFile } from "@/lib/fs"
import { parseDart, parseNews, parseForum, parseMarket } from "@/lib/parser"
import { clearCache } from "@/lib/cache"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const source = searchParams.get("source")

    if (!date || !source) {
      return NextResponse.json({ error: "Date and source parameters required" }, { status: 400 })
    }

    const content = await request.text()

    if (!content.trim()) {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 })
    }

    // Write file
    const filename = `${source}.txt`
    await writeSourceFile(date, filename, content)

    // Parse for preview
    let parsed: any = { raw: content }

    if (source === "dart") {
      parsed = parseDart(content)
    } else if (source === "news") {
      parsed = parseNews(content)
    } else if (source === "forum") {
      parsed = parseForum(content)
    } else if (source === "market") {
      parsed = parseMarket(content)
    }

    // Clear cache for this date
    clearCache()

    return NextResponse.json({
      success: true,
      date,
      source,
      filename,
      preview: parsed,
    })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
