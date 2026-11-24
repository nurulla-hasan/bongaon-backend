-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reviews_product_id_is_approved_created_at_idx" ON "reviews"("product_id", "is_approved", "created_at");

-- CreateIndex
CREATE INDEX "reviews_is_approved_created_at_idx" ON "reviews"("is_approved", "created_at");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
