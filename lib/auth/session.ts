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

export async function getSession(): Promise<SessionUser | null> {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, getSecretKey());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
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