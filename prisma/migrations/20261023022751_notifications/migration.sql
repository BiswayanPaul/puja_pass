-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "providerMessageId" TEXT,
    "sendAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_status_sendAfter_idx" ON "Notification"("status", "sendAfter");

-- CreateIndex
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Match the other tables: no access through Supabase's public API roles.
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
