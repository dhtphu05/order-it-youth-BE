-- CreateEnum
CREATE TYPE "DonationPaymentProvider" AS ENUM ('VIETQR', 'PAYOS');

-- CreateEnum
CREATE TYPE "DonationPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "donation_code" VARCHAR(40) NOT NULL,
    "student_name" VARCHAR(120) NOT NULL,
    "student_class" VARCHAR(60) NOT NULL,
    "mssv" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_provider" "DonationPaymentProvider" NOT NULL,
    "payment_ref" VARCHAR(120),
    "payment_payload" JSONB,
    "payment_status" "DonationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "pvcd_points" INTEGER,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donations_donation_code_key" ON "donations"("donation_code");

-- CreateIndex
CREATE INDEX "idx_donations_mssv" ON "donations"("mssv");

-- CreateIndex
CREATE INDEX "idx_donations_code" ON "donations"("donation_code");

-- CreateIndex
CREATE INDEX "idx_donations_status" ON "donations"("payment_status");
