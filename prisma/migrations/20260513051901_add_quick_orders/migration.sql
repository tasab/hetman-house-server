-- CreateEnum
CREATE TYPE "QuickOrderStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "QuickOrder" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" "QuickOrderStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickOrder_pkey" PRIMARY KEY ("id")
);
