/* tsx scripts/export_qr_pdf.ts output.pdf */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "node:fs";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma";

async function main() {
  const output = process.argv[2] || "qr_cards.pdf";
  const attendees = await prisma.attendee.findMany({ orderBy: { name: "asc" } });

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  // A4: 595 x 842 points
  const pageWidth = 595;
  const pageHeight = 842;

  // Grid config
  const cols = 3;
  const rows = 8;
  const margin = 24;
  const cellW = (pageWidth - margin * 2) / cols;
  const cellH = (pageHeight - margin * 2) / rows;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let col = 0;
  let row = 0;

  for (const a of attendees) {
    // New page if needed
    if (row >= rows) {
      page = pdf.addPage([pageWidth, pageHeight]);
      col = 0;
      row = 0;
    }

    const x = margin + col * cellW;
    const y = pageHeight - margin - (row + 1) * cellH;

    const label = `${a.name} (${a.employee_id})`;
    page.drawRectangle({ x: x + 6, y: y + 6, width: cellW - 12, height: cellH - 12, color: rgb(1,1,1), borderColor: rgb(0.83, 0, 0.2), borderWidth: 1 });
    page.drawText(label, { x: x + 12, y: y + cellH - 28, size: 10, font, color: rgb(0,0,0) });

    const dataUrl = await QRCode.toDataURL(a.employee_id, { margin: 1, width: 180 });
    const base64 = dataUrl.split(",")[1];
    const pngBytes = Buffer.from(base64, "base64");
    const pngImage = await pdf.embedPng(pngBytes);

    const imgW = Math.min(180, cellW - 24);
    const imgH = imgW;
    page.drawImage(pngImage, { x: x + 12, y: y + 24, width: imgW, height: imgH });

    col++;
    if (col >= cols) {
      col = 0;
      row++;
    }
  }

  const bytes = await pdf.save();
  fs.writeFileSync(output, bytes);
  console.log(`Saved ${output} with ${attendees.length} QR cards`);
}

main().then(() => prisma.$disconnect());