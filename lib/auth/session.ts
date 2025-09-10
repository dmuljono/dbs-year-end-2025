// lib/session.ts
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h

export type SessionUser = {
  sub: string;
  employee_id: string;
  email: string;
  role: "attendee" | "staff" | "admin";
  name?: string;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const jwt = await new SignJWT(user as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());

  cookies().set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return jwt;
}

export type Session = {
  sub: string;
  employee_id: string;
  email: string;
  role: "attendee" | "staff" | "admin";
  name?: string;
};

export async function getSession(): Promise<Session | null> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, getSecretKey(), {
      algorithms: ["HS256"],
      clockTolerance: "5s",
    });
    return payload as unknown as Session;
  } catch (err) {
    console.error("[getSession] invalid token:", err);
    return null;
  }
}

export async function clearSession() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

/* --- minimal additions for API auth --- */

export async function getSessionFromRequest(req: NextRequest): Promise<Session | null> {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, getSecretKey(), {
      algorithms: ["HS256"],
      clockTolerance: "5s",
    });
    const { sub, employee_id, email, role, name } = payload as JWTPayload & Partial<Session>;
    if (!sub || !email || !role) return null;
    return {
      sub: String(sub),
      employee_id: String(employee_id ?? ""),
      email: String(email),
      role: role as Session["role"],
      name: typeof name === "string" ? name : undefined,
    };
  } catch (err) {
    console.error("[getSessionFromRequest] invalid token:", err);
    return null;
  }
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ ok: true; user: Session } | { ok: false; res: NextResponse }> {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { ok: false, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, user };
}
  