-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "verificationNote" TEXT;

-- AlterTable
ALTER TABLE "ClubApplication" ADD COLUMN     "reviewedById" TEXT;

-- AddForeignKey
ALTER TABLE "ClubApplication" ADD CONSTRAINT "ClubApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
