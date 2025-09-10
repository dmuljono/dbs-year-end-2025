import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

function normKey(k: string) {
  return k.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, '_');
}

type Raw = Record<string, any>;

function toRole(val: any): Role {
  const s = String(val ?? '').trim().toLowerCase();
  if (s === 'admin') return 'admin';
  if (s === 'staff') return 'staff';
  return 'attendee';
}

function mapRow(raw: Raw) {
  const nrm: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    nrm[normKey(k)] = typeof v === 'string' ? v.trim() : v;
  }
  const employee_id =
    nrm['employee_id'] ??
    nrm['employeeid'] ??
    nrm['employee_no'] ??
    nrm['employee_number'] ??
    nrm['id'];
  const email = nrm['email'] ?? nrm['email_address'];
  const name = nrm['name'] ?? nrm['full_name'] ?? nrm['fullname'];
  const role: Role = toRole(nrm['role'] ?? nrm['roles']);

  return { employee_id, email, name, role };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.log('Usage: tsx scripts/import_attendees_bom.ts /path/to/attendees.csv');
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.log('CSV_NOT_FOUND');
    process.exit(1);
  }
  const csvBuf = fs.readFileSync(csvPath);
  const csvText = csvBuf.toString('utf8');
  const records = parse(csvText, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Raw[];

  let processed = 0;
  let upserted = 0;
  let skipped = 0;
  const reasons: Record<string, number> = {};

  for (const rec of records) {
    processed++;
    try {
      const { employee_id, email, name, role } = mapRow(rec);
      if (!employee_id) {
        skipped++; reasons['missing_employee_id'] = (reasons['missing_employee_id'] || 0) + 1; continue;
      }
      if (!email) {
        skipped++; reasons['missing_email'] = (reasons['missing_email'] || 0) + 1; continue;
      }
      if (!name) {
        skipped++; reasons['missing_name'] = (reasons['missing_name'] || 0) + 1; continue;
      }

      await prisma.attendee.upsert({
        where: { employee_id: String(employee_id) },
        update: { email: String(email), name: String(name), role },
        create: { employee_id: String(employee_id), email: String(email), name: String(name), role },
      });
      upserted++;
    } catch (e: any) {
      skipped++;
      const code = (e && (e.code || e.name)) || 'UNKNOWN';
      reasons[String(code)] = (reasons[String(code)] || 0) + 1;
    }
  }

  const summary = `Processed ${processed}, Imported/updated ${upserted}, Skipped ${skipped}`;
  console.log(summary);

  try {
    const logLines = [summary, 'Reasons: ' + JSON.stringify(reasons)];
    fs.writeFileSync(path.resolve(process.cwd(), '.import_attendees.log'), logLines.join('\n'), { encoding: 'utf8' });
  } catch {}

  await prisma.$disconnect();
}

main().catch(async () => {
  console.log('IMPORT_FAILED');
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});