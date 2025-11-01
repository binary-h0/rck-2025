import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const runtime = "nodejs"

export async function GET() {
  try {
    const base = path.join(process.cwd(), "data", "law")
    const inc = await fs.readFile(path.join(base, "income_tax_brackets.json"), "utf-8").catch(() => "{}")
    const rel = await fs.readFile(path.join(base, "withholding_relief.json"), "utf-8").catch(() => "{}")
    return NextResponse.json({ incomeTax: JSON.parse(inc), withholdingRelief: JSON.parse(rel) })
  } catch (e) {
    return NextResponse.json({ incomeTax: {}, withholdingRelief: {} })
  }
}


