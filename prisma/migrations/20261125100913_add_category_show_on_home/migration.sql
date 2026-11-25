-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "show_on_home" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "store_name" TEXT NOT NULL DEFAULT 'Bongaon Bazar',
    "support_phone" TEXT NOT NULL DEFAULT '',
    "whatsapp_number" TEXT NOT NULL DEFAULT '',
    "support_email" TEXT NOT NULL DEFAULT '',
    "store_address" TEXT NOT NULL DEFAULT '',
    "default_delivery_charge" INTEGER NOT NULL DEFAULT 120,
    "free_delivery_min_order" INTEGER NOT NULL DEFAULT 0,
    "estimated_delivery_days" TEXT NOT NULL DEFAULT '4-7 Days',
    "announcement_enabled" BOOLEAN NOT NULL DEFAULT false,
    "announcement_text" TEXT NOT NULL DEFAULT '',
    "is_ordering_enabled" BOOLEAN NOT NULL DEFAULT true,
    "order_alert_email" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_is_active_show_on_home_sort_order_idx" ON "categories"("is_active", "show_on_home", "sort_order");
