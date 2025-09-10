import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "20");

  const where: Prisma.AttendeeWhereInput = search
    ? {
        OR: [
          { employee_id: { contains: search, mode: "insensitive" } as const },
          { email: { contains: search, mode: "insensitive" } as const },
          { name: { contains: search, mode: "insensitive" } as const }
        ]
      }
    : {};

  const [total, data] = await Promise.all([
    prisma.attendee.count({ where }),
    prisma.attendee.findMany({
      where,
      orderBy: { created_at: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}