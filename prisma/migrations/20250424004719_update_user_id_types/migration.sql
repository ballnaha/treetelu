/*
  Warnings:

  - You are about to alter the column `userId` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `UnsignedInt`.
  - You are about to alter the column `verifiedBy` on the `payment_confirmations` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `UnsignedInt`.
  - You are about to alter the column `verifiedBy` on the `payment_info` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `UnsignedInt`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_userId_fkey`;

-- DropForeignKey
ALTER TABLE `payment_confirmations` DROP FOREIGN KEY `payment_confirmations_verifiedBy_fkey`;

-- DropForeignKey
ALTER TABLE `payment_info` DROP FOREIGN KEY `payment_info_verifiedBy_fkey`;

-- AlterTable
ALTER TABLE `orders` MODIFY `userId` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `payment_confirmations` MODIFY `verifiedBy` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `payment_info` MODIFY `verifiedBy` INTEGER UNSIGNED NULL;

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_info` ADD CONSTRAINT `payment_info_verifiedBy_fkey` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_confirmations` ADD CONSTRAINT `payment_confirmations_verifiedBy_fkey` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
