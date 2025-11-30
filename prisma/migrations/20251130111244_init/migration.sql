-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PAID', 'FULFILLING', 'FULFILLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "account_name" VARCHAR(160),
ALTER COLUMN "bank_code" DROP NOT NULL,
ALTER COLUMN "account_no" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_status" "OrderStatus" NOT NULL DEFAULT 'CREATED';
