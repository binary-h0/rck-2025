import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

export async function GET() {
  try {
    const fp = path.join(process.cwd(), "data", "my", "holdings.json")
    const raw = await fs.readFile(fp, "utf-8").catch(() => "")
    if (!raw) return NextResponse.json({ holdings: [] })
    const json = JSON.parse(raw)
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ holdings: [] })
  }
}


