-- AlterTable
ALTER TABLE "purchase_requests" ADD COLUMN     "reason" VARCHAR(255);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refreshToken" VARCHAR(255);
