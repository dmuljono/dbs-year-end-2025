MVP Plan (<= 8 core files listed; additional files will be added in follow-ups)
- package.json: Next.js + Tailwind + Prisma + scripts
- prisma/schema.prisma: DB schema with enums Role and ItemType, Attendee, RedemptionLog
- lib/auth/session.ts: jose-based signed JWT cookie session helpers (create/get/clear)
- lib/prisma.ts: PrismaClient singleton
- middleware.ts: auth redirect + role guards (/staff, /admin)
- app/page.tsx: Login form (email + employee_id)
- app/my/page.tsx: Attendee dashboard (QR + quotas)
- app/api/auth/login/route.ts and app/api/me/route.ts and app/api/me/qr/route.ts: Auth + me + QR

Notes:
- Additional APIs (/api/redeem, /api/checkin, /api/admin/attendees, /api/admin/logs) and pages (/staff, /staff/scan, /admin, /admin/logs) will also be created to meet the full spec.
- Tailwind + basic styling with primary color #D50032, clean UX.