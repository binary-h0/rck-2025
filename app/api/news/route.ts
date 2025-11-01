import { NextResponse } from "next/server"
import { writeSourceFile, readSourceFile } from "@/lib/fs"

export const runtime = "nodejs"

function todayKST(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const yyyy = kst.getUTCFullYear()
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(kst.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
]

async function fetchTextWithUA(url: string, attempt = 0): Promise<string> {
  const ua = UAS[attempt % UAS.length]
  const res = await fetch(url, {
    headers: {
      "User-Agent": ua,
      "Accept": "application/rss+xml, text/xml;q=0.9, */*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Referer": "https://news.google.com/",
    },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`http ${res.status}`)
  return await res.text()
}

function parseGenericRss(xml: string) {
  const items: { title: string; link: string; pubDate?: string; source?: string }[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(xml))) {
    const block = m[1]
    const title = ((block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || [])[1]
      || (block.match(/<title>(.*?)<\/title>/) || [])[1])
      || ""
    const rawLink = ((block.match(/<link>(.*?)<\/link>/) || [])[1] || "").trim()
    const link = normalizeAggregatorLink(rawLink)
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1]
    const source = (block.match(/<source.*?>(.*?)<\/source>/) || [])[1]
      || (block.match(/<dc:source.*?>(.*?)<\/dc:source>/) || [])[1]
      || domainFromUrl(link)
    if (title && link) items.push({ title, link, pubDate, source })
  }
  return items
}

function domainFromUrl(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "")
  } catch { return "" }
}

async function fetchNewsCombined(): Promise<{ title: string; link: string; pubDate?: string; source?: string }[]> {
  const queries = ["KT 통신", "KT 주식", "KT corporation"]
  const results: { title: string; link: string; pubDate?: string; source?: string }[] = []
  for (let qi = 0; qi < queries.length; qi++) {
    const q = encodeURIComponent(queries[qi])
    const url = `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`
    let xml: string | null = null
    // Try up to 3 attempts with UA rotation
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        xml = await fetchTextWithUA(url, attempt)
        break
      } catch {}
    }
    // Mirror fallback via r.jina.ai
    if (!xml) {
      const mirror = `https://r.jina.ai/https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`
      for (let attempt = 0; attempt < 2 && !xml; attempt++) {
        try {
          xml = await fetchTextWithUA(mirror, attempt)
        } catch {}
      }
    }
    if (!xml) continue
    const parsed = parseGenericRss(xml)
    results.push(...parsed)
  }

  // If still empty, try Bing News RSS
  if (results.length === 0) {
    for (let qi = 0; qi < queries.length; qi++) {
      const q = encodeURIComponent(queries[qi])
      const url = `https://www.bing.com/news/search?q=${q}&setlang=ko&format=RSS`
      let xml: string | null = null
      for (let attempt = 0; attempt < 3; attempt++) {
        try { xml = await fetchTextWithUA(url, attempt) ; break } catch {}
      }
      if (!xml) {
        const mirror = `https://r.jina.ai/https://www.bing.com/news/search?q=${q}&setlang=ko&format=RSS`
        for (let attempt = 0; attempt < 2 && !xml; attempt++) {
          try { xml = await fetchTextWithUA(mirror, attempt) } catch {}
        }
      }
      if (!xml) continue
      const parsed = parseGenericRss(xml)
      results.push(...parsed)
    }
  }

  // De-duplicate by title
  const seen = new Set<string>()
  const dedup = results.filter((it) => {
    const key = it.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return dedup.slice(0, 15)
}

function normalizeAggregatorLink(link: string): string {
  try {
    const u = new URL(link)
    // Google News: use url/q when present
    if (u.hostname.includes("news.google.")) {
      const embedded = u.searchParams.get("url") || u.searchParams.get("q")
      if (embedded && /^https?:\/\//.test(embedded)) return embedded
    }
    // Bing News apiclick: extract url param
    if (u.hostname.includes("bing.com") && u.pathname.includes("apiclick")) {
      const embedded = u.searchParams.get("url")
      if (embedded && /^https?:\/\//.test(embedded)) return decodeURIComponent(embedded)
    }
    return link
  } catch {
    return link
  }
}

async function readSavedItems(date: string): Promise<{ title: string; link: string; source?: string }[]> {
  const raw = await readSourceFile(date, "new-list.txt")
  if (!raw) return []
  const out: { title: string; link: string; source?: string }[] = []
  raw.split("\n").forEach((line) => {
    const parts = line.split("|").map((p) => p.trim())
    if (parts.length >= 3) out.push({ title: parts[0], link: parts[1], source: parts[2] })
  })
  return out
}

async function getNextCollectAt(date: string): Promise<Date | null> {
  const iso = await readSourceFile(date, "news-next.txt")
  if (!iso) return null
  const d = new Date(iso.trim())
  return isNaN(d.getTime()) ? null : d
}

export async function GET() {
  try {
    const date = todayKST()
    // 1) If within cooldown window (1h), return saved items
    const nextAt = await getNextCollectAt(date)
    if (nextAt && Date.now() < nextAt.getTime()) {
      const saved = await readSavedItems(date)
      return NextResponse.json({ date, items: saved, cached: true, nextAt: nextAt.toISOString() })
    }
    let list: { title: string; link: string; pubDate?: string; source?: string }[] = []
    try {
      list = await fetchNewsCombined()
    } catch (e) {
      console.error("[news] combined fetch error", e)
      // Keep list empty to avoid misleading mocks
      list = []
    }
    // Save only: title | link | source
    const lines = list.map((n) => `${n.title} | ${n.link} | ${n.source || ""}`).join("\n")
    // Save as per requirement: ./data/{date}/new-list.txt
    await writeSourceFile(date, "new-list.txt", lines)
    // Set next collect time: +1 hour
    const next = new Date(Date.now() + 60 * 60 * 1000)
    await writeSourceFile(date, "news-next.txt", next.toISOString())
    return NextResponse.json({ date, items: list })
  } catch (e) {
    console.error("[news] fetch error", e)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 502 })
  }
}


