-- CreateEnum
CREATE TYPE "WaDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateTable
CREATE TABLE "whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "direction" "WaDirection" NOT NULL,
    "from_phone" TEXT NOT NULL,
    "to_phone" TEXT,
    "body" TEXT NOT NULL,
    "intent" TEXT,
    "charge_id" TEXT,
    "merchant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_accounts_phone_key" ON "whatsapp_accounts"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_accounts_merchant_id_idx" ON "whatsapp_accounts"("merchant_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_from_phone_created_at_idx" ON "whatsapp_messages"("from_phone", "created_at");

-- CreateIndex
CREATE INDEX "whatsapp_messages_merchant_id_idx" ON "whatsapp_messages"("merchant_id");
