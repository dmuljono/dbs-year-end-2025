import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const schema = z.object({ employee_id: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "staff")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { employee_id } = parsed.data;

  const attendee = await prisma.attendee.update({
    where: { employee_id },
    data: { checked_in: true }
  }).catch(() => null);

  if (!attendee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(attendee);
}