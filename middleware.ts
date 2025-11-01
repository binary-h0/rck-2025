import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Simply pass through - bootstrap will happen via API route
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
