/*
  Warnings:

  - You are about to drop the column `Vin_Alb` on the `vin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vin` DROP COLUMN `Vin_Alb`,
    ADD COLUMN `Vin_Rosu` INTEGER NOT NULL DEFAULT 0;
