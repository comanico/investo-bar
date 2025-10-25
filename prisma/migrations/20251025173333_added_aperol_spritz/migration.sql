/*
  Warnings:

  - You are about to drop the column `Aperol` on the `vin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vin` DROP COLUMN `Aperol`,
    ADD COLUMN `Aperol_Spritz` INTEGER NOT NULL DEFAULT 0;
