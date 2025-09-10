import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  employee_id: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, employee_id } = parsed.data;

  const attendee = await prisma.attendee.findFirst({
    where: { email, employee_id }
  });

  if (!attendee) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession({
    sub: attendee.id,
    employee_id: attendee.employee_id,
    email: attendee.email,
    role: attendee.role
  });

  const redirect =
    attendee.role === "admin" ? "/admin" :
    attendee.role === "staff" ? "/staff" : "/my";

  return NextResponse.json({ redirect });
}