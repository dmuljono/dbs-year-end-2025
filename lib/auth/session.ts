import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { cookies } from "next/headers";

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
  const secret = getSecretKey();
  const jwt = await new SignJWT(user as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`) // ✅ duration, not absolute 86400
    .sign(secret);

  cookies().set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" ? true : false,
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
      clockTolerance: "5s", // small leeway to avoid edge timing issues
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
    secure: process.env.NODE_ENV === "production" ? true : false,
    path: "/",
    expires: new Date(0),
  });
}
