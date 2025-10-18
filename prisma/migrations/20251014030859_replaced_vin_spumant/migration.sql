/*
  Warnings:

  - You are about to drop the column `Vin_Spumant` on the `vin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vin` DROP COLUMN `Vin_Spumant`,
    ADD COLUMN `Vin_Alb` INTEGER NOT NULL DEFAULT 0;
