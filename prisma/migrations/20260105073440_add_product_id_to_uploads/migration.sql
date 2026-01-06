-- AlterTable
ALTER TABLE "uploads" ADD COLUMN     "productId" INTEGER;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
