import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  employee_id: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Normalize inputs (trim + lower-case email)
    const email = parsed.data.email.trim().toLowerCase();
    const employee_id = String(parsed.data.employee_id).trim();

    // Case-insensitive email match; exact employee_id
    const attendee = await prisma.attendee.findFirst({
      where: {
        employee_id,
        email: { equals: email, mode: "insensitive" }
      },
      select: { id: true, employee_id: true, email: true, role: true, name: true }
    });

    if (!attendee) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Persist session (your createSession should set the cookie)
    await createSession({
      sub: attendee.id,
      employee_id: attendee.employee_id,
      email: attendee.email,
      role: attendee.role.toLowerCase() as "attendee"|"staff"|"admin",
      name: attendee.name,
    });


    // Fix: your Prisma enum is likely UPPERCASE (ADMIN/STAFF/ATTENDEE)
    const role = String(attendee.role).toUpperCase();
    const redirect = role === "ADMIN" ? "/admin" : role === "STAFF" ? "/staff" : "/my";

    // Include role for client-side routing if needed
    return NextResponse.json({ redirect, role }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err: any) {
    console.error("[LOGIN] unexpected error:", err);
    return NextResponse.json(
      { error: "server_error", message: err?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
