-- AlterTable
ALTER TABLE "contact_messages" ADD COLUMN     "admin_reply" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "replied_at" TIMESTAMP(3),
ADD COLUMN     "replied_by_id" TEXT;
