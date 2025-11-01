import { NextResponse } from "next/server"
import { listSourceFiles, readSourceFile } from "@/lib/fs"
import { parseDart, parseNews, parseForum, parseMarket } from "@/lib/parser"
import { getCached, setCache } from "@/lib/cache"
import type { ParsedData } from "@/lib/types"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = `data-${date}`
    const cached = getCached(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Read and parse files
    const files = await listSourceFiles(date)
    // Ensure news with URLs (new-list.txt) takes priority when both exist
    files.sort((a, b) => {
      const aScore = a === "new-list.txt" ? 1 : 0
      const bScore = b === "new-list.txt" ? 1 : 0
      return aScore - bScore
    })
    const parsedData: ParsedData = {
      date,
      sources: {},
    }

    let newsFromNewList = false
    for (const filename of files) {
      const content = await readSourceFile(date, filename)
      const basename = filename.replace(".txt", "")

      let parsed: any = { raw: content }

      if (basename === "dart") {
        parsed = parseDart(content)
      } else if (basename === "news" || basename === "new-list") {
        parsed = parseNews(content)
      } else if (basename === "forum") {
        parsed = parseForum(content)
      } else if (basename === "market") {
        parsed = parseMarket(content)
      }

      const keyName = basename === "new-list" ? "news" : basename
      if (keyName === "news" && basename === "news" && newsFromNewList) {
        // Skip overwriting richer news coming from new-list
        continue
      }

      parsedData.sources[keyName] = {
        filename,
        lines: content.split("\n").filter((l) => l.trim()),
        parsed,
      }

      if (basename === "new-list") newsFromNewList = true
    }

    // Cache the result
    setCache(cacheKey, parsedData)

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error("[v0] Error fetching data:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
