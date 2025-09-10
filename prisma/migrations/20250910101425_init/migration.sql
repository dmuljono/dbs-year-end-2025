-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('attendee', 'staff', 'admin');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('indomie', 'beer');

-- CreateTable
CREATE TABLE "public"."Attendee" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'attendee',
    "quota_indomie" INTEGER NOT NULL DEFAULT 1,
    "quota_beer" INTEGER NOT NULL DEFAULT 3,
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "last_redeem_ts" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RedemptionLog" (
    "id" TEXT NOT NULL,
    "attendee_id" TEXT NOT NULL,
    "item" "public"."ItemType" NOT NULL,
    "delta" INTEGER NOT NULL DEFAULT -1,
    "booth_id" TEXT NOT NULL,
    "scanned_by" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedemptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_employee_id_key" ON "public"."Attendee"("employee_id");

-- CreateIndex
CREATE INDEX "Attendee_email_idx" ON "public"."Attendee"("email");

-- CreateIndex
CREATE INDEX "Attendee_role_idx" ON "public"."Attendee"("role");

-- CreateIndex
CREATE INDEX "RedemptionLog_item_ts_idx" ON "public"."RedemptionLog"("item", "ts");

-- CreateIndex
CREATE INDEX "RedemptionLog_attendee_id_ts_idx" ON "public"."RedemptionLog"("attendee_id", "ts");

-- AddForeignKey
ALTER TABLE "public"."RedemptionLog" ADD CONSTRAINT "RedemptionLog_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."Attendee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
