# DBS Year End 2025 Microsite

Next.js (App Router) + Prisma (Postgres) + Tailwind. Signed cookie auth using jose. QR codes encode employee_id only.

## Tech Stack

- Next.js (App Router)
- Prisma ORM (Postgres)
- Tailwind CSS
- TypeScript
- jose (JWT cookie)
- qrcode (QR generation)
- pdf-lib (QR cards PDF)
- csv-parse (CSV import)

## Environment

Create `.env.local` (do not commit secrets):

```
DATABASE_URL=postgresql://USER:PASS@HOST:5432/dbs_event
APP_NAME=DBS Year End 2025 Microsite
BASE_URL=https://yearend2025.example.com
SESSION_SECRET=replace_me
```

## Quickstart

1. Install deps

```
pnpm i
```

2. Generate Prisma client

```
pnpm prisma:generate
```

3. Migrate DB (creates tables)

```
pnpm prisma:migrate --name init
```

4. Dev server

```
pnpm dev
```

Visit http://localhost:3000

## Scripts

- Import attendees CSV (headers: employee_id,email,name,role)

```
pnpm import:attendees path/to/attendees.csv
```

- Export printable QR cards (A4 grid) to PDF

```
pnpm export:qr qr_cards.pdf
```

## API Routes

- POST /api/auth/login {email, employee_id}
- GET /api/me
- GET /api/me/qr?format=svg|png
- POST /api/redeem {employee_id, item, booth_id} (staff/admin)
- POST /api/checkin {employee_id} (staff/admin)
- GET /api/admin/attendees?search=&page=&pageSize= (admin)
- GET /api/admin/logs?item=&from=&to=&format=csv (admin)

## Pages

- / (login)
- /my (attendee QR + quotas)
- /staff (item picker + booth id)
- /staff/scan (manual entry; camera scanner can be added)
- /admin, /admin/logs (basic admin logs UI)

## Deployment

- Vercel recommended. Set env vars in Vercel project:
  - DATABASE_URL
  - SESSION_SECRET
  - APP_NAME
  - BASE_URL

Ensure Prisma runs with `postinstall` to generate client. Use connection pooling if needed (e.g., pgbouncer).