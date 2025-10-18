/*
  Warnings:

  - You are about to drop the column `Apa_Minerala` on the `racoritoare` table. All the data in the column will be lost.
  - You are about to drop the column `Apa_Plata` on the `racoritoare` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `racoritoare` DROP COLUMN `Apa_Minerala`,
    DROP COLUMN `Apa_Plata`,
    ADD COLUMN `Apa` INTEGER NOT NULL DEFAULT 0;
