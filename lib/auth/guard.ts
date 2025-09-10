import { getSession } from "@/lib/auth/session";

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "admin") {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return s;
}
