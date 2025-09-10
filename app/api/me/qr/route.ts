import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const format = req.nextUrl.searchParams.get("format") || "png";

  if (format === "svg") {
    const svgString = await QRCode.toString(session.employee_id, { type: "svg", margin: 2, width: 256 });
    return new NextResponse(svgString, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" }
    });
  } else {
    const dataUrl = await QRCode.toDataURL(session.employee_id, { margin: 2, width: 256 });
    const base64 = dataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    return new NextResponse(buffer, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" }
    });
  }
}