import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/api/auth/login", "/api/health", "/api/db", "/_next", "/favicon.ico", "/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sessionRaw = req.cookies.get("session")?.value;
  if (!sessionRaw) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);   // back to login
  }

  // already authenticated → continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
