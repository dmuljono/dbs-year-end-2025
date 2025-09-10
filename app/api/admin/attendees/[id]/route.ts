import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";

// Accept DB keys and common UI aliases
const PATCHABLE = new Set<string>([
  "employee_id",
  "email",
  "name",
  "role",
  "quota_indomie",
  "quota_beer",
  "checked_in",
]);

const ALIASES: Record<string, keyof Prisma.AttendeeUpdateInput> = {
  // ui/legacy -> db
  indomie_quota: "quota_indomie",
  beer_quota: "quota_beer",
  checkin: "checked_in",
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // --- parse body here ---
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const data: Prisma.AttendeeUpdateInput = {};

    for (const [rawK, v] of Object.entries(body)) {
      // remap alias if present
      const k = (ALIASES[rawK] as string) || rawK;
      if (!PATCHABLE.has(k)) continue;

      if (k === "email" && typeof v === "string") {
        (data as any)[k] = v.toLowerCase().trim();
      } else if ((k === "name" || k === "employee_id") && typeof v === "string") {
        (data as any)[k] = v.trim();
      } else if ((k === "quota_indomie" || k === "quota_beer") && v !== null && v !== undefined) {
        const n = typeof v === "string" ? Number(v) : (v as number);
        if (!Number.isNaN(n)) (data as any)[k] = n;
      } else if (k === "checked_in") {
        (data as any)[k] = !!v;
      } else {
        (data as any)[k] = v as any;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No patchable fields provided" }, { status: 400 });
    }

    const updated = await prisma.attendee.update({
      where: { id },
      data,
      select: {
        id: true,
        employee_id: true,
        email: true,
        name: true,
        role: true,
        quota_indomie: true,
        quota_beer: true,
        checked_in: true,
        last_redeem_ts: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ data: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    console.error("[admin/attendees PATCH] error:", err);
    return NextResponse.json(
      { error: "Server error", message: err?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
