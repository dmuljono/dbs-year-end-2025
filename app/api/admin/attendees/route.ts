import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";

const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    // support both ?search= and ?q=
    const rawSearch = (searchParams.get("search") ?? searchParams.get("q") ?? "").trim();
    const rawPage = searchParams.get("page") ?? "1";
    const rawPageSize = searchParams.get("pageSize") ?? "20";

    // sanitize numbers
    let page = Number.parseInt(rawPage, 10);
    let pageSize = Number.parseInt(rawPageSize, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;
    if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

    const where: Prisma.AttendeeWhereInput = rawSearch
      ? {
          OR: [
            // employee_id is often numeric-ish; case sensitivity irrelevant
            { employee_id: { contains: rawSearch } },
            { email: { contains: rawSearch, mode: "insensitive" } },
            { name: { contains: rawSearch, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.attendee.count({ where }),
      prisma.attendee.findMany({
        where,
        orderBy: { created_at: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json(
      {
        data: items,
        meta: {
          total,
          page,
          pageSize,
          totalPages,
          hasNext,
          hasPrev,
          search: rawSearch || null,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[admin/attendees GET] error:", err);
    return NextResponse.json(
      { error: "Server error", message: err?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: Partial<{
      employee_id: string;
      email: string;
      name: string;
      role: "attendee" | "staff" | "admin";
      quota_indomie: number;
      quota_beer: number;
      checked_in: boolean;
    }>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const employee_id = (body.employee_id ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const name = (body.name ?? "").trim();
    if (!employee_id || !email || !name) {
      return NextResponse.json(
        { error: "employee_id, email, and name are required" },
        { status: 400 }
      );
    }

    const created = await prisma.attendee.create({
      data: {
        employee_id,
        email,
        name,
        role: body.role ?? "attendee",
        quota_indomie: body.quota_indomie ?? 1,
        quota_beer: body.quota_beer ?? 0,
        checked_in: body.checked_in ?? false,
      },
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

    return NextResponse.json({ data: created }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    console.error("[admin/attendees POST] error:", err);
    return NextResponse.json(
      { error: "Server error", message: err?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
