import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";

function publicPaths(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/assets")) return true;
  if (pathname.startsWith("/api/auth/login")) return true;
  return false;
}

async function verify(token: string | undefined) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verify(token);

  // Allow public paths
  if (publicPaths(pathname)) {
    return NextResponse.next();
  }

  // Block unauthenticated for all other pages (including /my, /staff, /admin) but allow non-auth API except admin/staff actions
  if (!session) {
    // Allow some public GET api (none for now) else redirect
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role guards
  const role = session.role as string;
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else if (pathname.startsWith("/staff")) {
    if (!(role === "staff" || role === "admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};