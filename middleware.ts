import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/api/auth/login", "/api/health", "/api/db", "/_next", "/favicon.ico", "/"]; 

const ADMIN_PATHS = ["/admin", "/api/admin"];

function startsWithAny(pathname: string, bases: string[]) {
  return bases.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

async function getRoleFromJWT(token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    // payload.role is set as "attendee" | "staff" | "admin"
    const role = typeof payload.role === "string" ? payload.role : null;
    return role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and Next.js internals
  if (startsWithAny(pathname, PUBLIC_PATHS)) {
    return NextResponse.next();
  }

  // Read session token (JWT) from cookie
  const sessionRaw = req.cookies.get("session")?.value;
  if (!sessionRaw) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin-gate for /admin and /api/admin/*
  if (startsWithAny(pathname, ADMIN_PATHS)) {
    const role = await getRoleFromJWT(sessionRaw);
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Authenticated → continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
