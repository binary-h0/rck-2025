import { promises as fs } from "fs"
import path from "path"

const DATA_ROOT = path.join(process.cwd(), "data")
const REPORT_ROOT = path.join(process.cwd(), "report")

export async function ensureDir(dirPath: string) {
  try {
    console.log("[v0] Ensuring directory exists:", dirPath)
    await fs.mkdir(dirPath, { recursive: true })
    console.log("[v0] Directory ready:", dirPath)
  } catch (error) {
    console.error("[v0] Error creating directory:", dirPath, error)
    // Directory might already exist, which is fine
  }
}

export async function listDates(): Promise<string[]> {
  await ensureDir(DATA_ROOT)
  try {
    const entries = await fs.readdir(DATA_ROOT)
    const dates = entries.filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry))
    return dates.sort().reverse()
  } catch {
    return []
  }
}

export async function listSourceFiles(date: string): Promise<string[]> {
  const dateDir = path.join(DATA_ROOT, sanitizeDate(date))
  try {
    const files = await fs.readdir(dateDir)
    return files.filter((f) => f.endsWith(".txt"))
  } catch {
    return []
  }
}

export async function readSourceFile(date: string, filename: string): Promise<string> {
  const filePath = path.join(DATA_ROOT, sanitizeDate(date), sanitizeFilename(filename))
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch {
    return ""
  }
}

export async function writeSourceFile(date: string, filename: string, content: string): Promise<void> {
  const dateDir = path.join(DATA_ROOT, sanitizeDate(date))
  await ensureDir(dateDir)
  const filePath = path.join(dateDir, sanitizeFilename(filename))
  await fs.writeFile(filePath, content, "utf-8")
}

export async function listReports(date: string): Promise<string[]> {
  const reportDir = path.join(REPORT_ROOT, sanitizeDate(date))
  try {
    const files = await fs.readdir(reportDir)
    return files.filter((f) => f.endsWith(".md"))
  } catch {
    return []
  }
}

export async function readReport(date: string, filename: string): Promise<string> {
  const filePath = path.join(REPORT_ROOT, sanitizeDate(date), sanitizeFilename(filename))
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch {
    return ""
  }
}

export async function writeReport(date: string, filename: string, content: string): Promise<void> {
  const reportDir = path.join(REPORT_ROOT, sanitizeDate(date))
  await ensureDir(reportDir)
  const filePath = path.join(reportDir, sanitizeFilename(filename))
  await fs.writeFile(filePath, content, "utf-8")
}

function sanitizeDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date format")
  }
  return date
}

function sanitizeFilename(filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "")
  if (!safe || safe.includes("..")) {
    throw new Error("Invalid filename")
  }
  return safe
}

export { DATA_ROOT, REPORT_ROOT }
