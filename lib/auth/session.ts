import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h


export type SessionUser = {
  sub: string;
  employee_id: string;
  email: string;
  role: "attendee" | "staff" | "admin";
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const secret = getSecretKey();
  const jwt = await new SignJWT(user as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL_SECONDS)
    .sign(secret);

  cookies().set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });

  return jwt;
}

export type Session = { id: string; role: "ADMIN"|"STAFF"|"ATTENDEE"; name: string; email: string };

export function getSession(): Session | null {
  const raw = cookies().get("session")?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as Session; }
  catch { return null; }
}

export async function clearSession() {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
}