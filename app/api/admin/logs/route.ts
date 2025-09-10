import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

function toCsv(rows: any[]) {
  const header = ["ts","employee_id","item","delta","booth_id","scanned_by","name","email"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const vals = [
      new Date(r.ts).toISOString(),
      r.attendee.employee_id,
      r.item,
      r.delta,
      r.booth_id,
      r.scanned_by,
      r.attendee.name,
      r.attendee.email
    ];
    lines.push(vals.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const item = searchParams.get("item") as "indomie" | "beer" | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const format = searchParams.get("format");

  const where: any = {};
  if (item) where.item = item;
  if (from || to) {
    where.ts = {};
    if (from) where.ts.gte = new Date(from);
    if (to) where.ts.lte = new Date(to);
  }

  const logs = await prisma.redemptionLog.findMany({
    where,
    include: { attendee: true },
    orderBy: { ts: "desc" }
  });

  if (format === "csv" || req.headers.get("accept")?.includes("text/csv")) {
    const csv = toCsv(logs);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="logs.csv"`
      }
    });
  }

  const json = logs.map(l => ({
    ts: l.ts,
    employee_id: l.attendee.employee_id,
    item: l.item,
    delta: l.delta,
    booth_id: l.booth_id,
    scanned_by: l.scanned_by,
    name: l.attendee.name,
    email: l.attendee.email
  }));

  return NextResponse.json(json);
}