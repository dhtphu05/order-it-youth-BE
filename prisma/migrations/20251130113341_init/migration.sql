-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERY_FAILED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_reason" TEXT,
ADD COLUMN     "delivery_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "delivery_failed_at" TIMESTAMP(3),
ADD COLUMN     "delivery_failed_reason" TEXT,
ADD COLUMN     "fulfilled_at" TIMESTAMP(3);
