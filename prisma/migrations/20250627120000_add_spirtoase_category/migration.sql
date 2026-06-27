-- CreateTable
CREATE TABLE `spirtoase` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Jameson` INTEGER NOT NULL DEFAULT 0,
    `Jameson_Black_Barrel` INTEGER NOT NULL DEFAULT 0,
    `Fireball` INTEGER NOT NULL DEFAULT 0,
    `Tequilla` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed initial inventory row
INSERT INTO `spirtoase` (`Jameson`, `Jameson_Black_Barrel`, `Fireball`, `Tequilla`) VALUES (0, 0, 0, 0);

-- Update existing spirits to spirtoase category
UPDATE `menu` SET `type` = 'Spirtoase' WHERE `product` IN ('Fireball', 'Tequilla');

-- Add new spirtoase menu items (skip if already present)
INSERT INTO `menu` (`product`, `type`, `price`, `quantity`)
SELECT 'Jameson', 'Spirtoase', 18.00, 0
WHERE NOT EXISTS (SELECT 1 FROM `menu` WHERE `product` = 'Jameson');

INSERT INTO `menu` (`product`, `type`, `price`, `quantity`)
SELECT 'Jameson Black Barrel', 'Spirtoase', 25.00, 0
WHERE NOT EXISTS (SELECT 1 FROM `menu` WHERE `product` = 'Jameson Black Barrel');

INSERT INTO `menu` (`product`, `type`, `price`, `quantity`)
SELECT 'Fireball', 'Spirtoase', 12.00, 0
WHERE NOT EXISTS (SELECT 1 FROM `menu` WHERE `product` = 'Fireball');

INSERT INTO `menu` (`product`, `type`, `price`, `quantity`)
SELECT 'Tequilla', 'Spirtoase', 12.00, 0
WHERE NOT EXISTS (SELECT 1 FROM `menu` WHERE `product` = 'Tequilla');

-- Sync default prices for existing spirtoase menu items
UPDATE `menu` SET `price` = 18.00 WHERE `product` = 'Jameson';
UPDATE `menu` SET `price` = 25.00 WHERE `product` = 'Jameson Black Barrel';
UPDATE `menu` SET `price` = 12.00 WHERE `product` = 'Fireball';
UPDATE `menu` SET `price` = 12.00 WHERE `product` = 'Tequilla';

-- Normalize type casing for spirtoase menu items
UPDATE `menu` SET `type` = 'Spirtoase' WHERE `product` IN ('Jameson', 'Jameson Black Barrel', 'Fireball', 'Tequilla');
