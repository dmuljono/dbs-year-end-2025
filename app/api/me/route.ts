// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session"; // <-- your updated session.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the attendee from DB using the id (sub) from session
  const attendee = await prisma.attendee.findUnique({
    where: { id: session.sub },
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
    },
  });

  if (!attendee) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(attendee, { headers: { "Cache-Control": "no-store" } });
}
