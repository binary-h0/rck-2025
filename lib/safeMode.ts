export function isSafeMode(): boolean {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  return params.get("safe") === "1" || localStorage.getItem("safeMode") === "1"
}

export function enableSafeMode() {
  if (typeof window === "undefined") return
  localStorage.setItem("safeMode", "1")
  const url = new URL(window.location.href)
  url.searchParams.set("safe", "1")
  window.location.href = url.toString()
}

export function disableSafeMode() {
  if (typeof window === "undefined") return
  localStorage.removeItem("safeMode")
  const url = new URL(window.location.href)
  url.searchParams.delete("safe")
  window.location.href = url.toString()
}

export function toggleSafeMode() {
  if (isSafeMode()) {
    disableSafeMode()
  } else {
    enableSafeMode()
  }
}
