import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const schema = z.object({
  employee_id: z.string().min(1),
  item: z.enum(["indomie", "beer"]),
  booth_id: z.string().min(1)
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "staff")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { employee_id, item, booth_id } = parsed.data;
  const quotaField = item === "indomie" ? "quota_indomie" : "quota_beer";

  const result = await prisma.$transaction(async (tx) => {
    // Attempt atomic decrement when quota > 0
    const updated = await tx.attendee.updateMany({
      where: {
        employee_id,
        [quotaField]: { gt: 0 }
      },
      data: {
        [quotaField]: { decrement: 1 },
        last_redeem_ts: new Date()
      }
    });

    if (updated.count === 0) {
      return { ok: false as const };
    }

    const attendee = await tx.attendee.findUnique({ where: { employee_id } });
    if (!attendee) {
      return { ok: false as const };
    }

    await tx.redemptionLog.create({
      data: {
        attendee_id: attendee.id,
        item: item as any,
        delta: -1,
        booth_id,
        scanned_by: session.email || session.employee_id
      }
    });

    return { ok: true as const, attendee };
  });

  if (!result.ok) {
    return NextResponse.json({ error: "Attendee not found or quota exhausted" }, { status: 400 });
  }

  const a = result.attendee!;
  return NextResponse.json({
    employee_id: a.employee_id,
    quota_indomie: a.quota_indomie,
    quota_beer: a.quota_beer,
    last_redeem_ts: a.last_redeem_ts
  });
}