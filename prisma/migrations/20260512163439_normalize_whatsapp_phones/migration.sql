-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELED');

-- AlterTable
ALTER TABLE "charges" ADD COLUMN     "subscription_id" TEXT;

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount_gs" BIGINT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "interval_count" INTEGER NOT NULL DEFAULT 1,
    "trial_days" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_subscriptions" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "external_id" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "next_charge_at" TIMESTAMP(3) NOT NULL,
    "trial_ends_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_plans_merchant_id_idx" ON "subscription_plans"("merchant_id");

-- CreateIndex
CREATE INDEX "customer_subscriptions_merchant_id_idx" ON "customer_subscriptions"("merchant_id");

-- CreateIndex
CREATE INDEX "customer_subscriptions_next_charge_at_status_idx" ON "customer_subscriptions"("next_charge_at", "status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_subscriptions_merchant_id_external_id_key" ON "customer_subscriptions"("merchant_id", "external_id");

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "customer_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Normalizar números de WhatsApp a E.164 (+595XXXXXXXXX)
UPDATE whatsapp_accounts
SET phone = CASE
  WHEN phone LIKE '+595%'      THEN phone
  WHEN phone ~ '^595[0-9]{9}$' THEN '+' || phone
  WHEN phone ~ '^0[0-9]{9}$'   THEN '+595' || substring(phone FROM 2)
  WHEN phone ~ '^[0-9]{9}$'    THEN '+595' || phone
  ELSE phone
END
WHERE phone NOT LIKE '+595%';
