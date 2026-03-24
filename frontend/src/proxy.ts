import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p === "/api/api/markets" || p === "/api/markets/_stats_list") {
    const url = req.nextUrl.clone();
    url.pathname = "/api/markets";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/api/markets", "/api/markets/_stats_list"],
};
