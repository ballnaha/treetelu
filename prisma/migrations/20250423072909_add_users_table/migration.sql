-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryName` VARCHAR(255) NULL,
    `categoryDesc` VARCHAR(255) NULL,
    `priority` SMALLINT NULL,
    `status` VARCHAR(50) NULL DEFAULT 'on',
    `bestseller` VARCHAR(50) NULL DEFAULT 'off',
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(255) NULL,
    `productImg` VARCHAR(255) NULL,
    `productName` VARCHAR(255) NULL,
    `slug` VARCHAR(255) NULL,
    `productDesc` TEXT NULL,
    `salesPrice` DECIMAL(10, 2) NULL,
    `originalPrice` DECIMAL(10, 2) NULL,
    `discount` INTEGER NULL,
    `potSize` VARCHAR(100) NULL,
    `plantHeight` VARCHAR(100) NULL,
    `preparationTime` VARCHAR(100) NULL,
    `stock` INTEGER NULL,
    `stockStatus` VARCHAR(255) NULL,
    `category` VARCHAR(255) NULL,
    `categoryId` INTEGER NULL,
    `productStatus` VARCHAR(50) NULL DEFAULT 'on',
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `product_sku_unique`(`sku`),
    INDEX `product_slug_index`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statusmaster` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NULL,
    `name` VARCHAR(100) NULL,
    `desc` VARCHAR(100) NULL,
    `type` VARCHAR(100) NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productimage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NULL,
    `imageName` VARCHAR(255) NULL,
    `imageDesc` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thaiamphures` (
    `id` INTEGER NOT NULL,
    `nameTh` VARCHAR(150) NOT NULL,
    `nameEn` VARCHAR(150) NOT NULL,
    `provinceId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,
    `deletedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thaigeographies` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thaiprovinces` (
    `id` INTEGER NOT NULL,
    `nameTh` VARCHAR(150) NOT NULL,
    `nameEn` VARCHAR(150) NOT NULL,
    `geographyId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,
    `deletedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thaitambons` (
    `id` INTEGER NOT NULL,
    `zipCode` INTEGER NOT NULL,
    `nameTh` VARCHAR(150) NOT NULL,
    `nameEn` VARCHAR(150) NOT NULL,
    `amphureId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,
    `deletedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(50) NOT NULL,
    `userId` BIGINT UNSIGNED NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `shippingCost` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `finalAmount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` ENUM('BANK_TRANSFER', 'CREDIT_CARD', 'PROMPTPAY', 'COD') NOT NULL DEFAULT 'BANK_TRANSFER',
    `paymentStatus` ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    INDEX `orders_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `productName` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL,
    `totalPrice` DECIMAL(10, 2) NOT NULL,
    `productImg` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `order_items_orderId_fkey`(`orderId`),
    INDEX `order_items_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `customer_info_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `receiverName` VARCHAR(100) NOT NULL,
    `receiverLastname` VARCHAR(100) NOT NULL,
    `receiverPhone` VARCHAR(20) NOT NULL,
    `addressLine` VARCHAR(255) NOT NULL,
    `addressLine2` VARCHAR(255) NULL,
    `provinceId` INTEGER NOT NULL,
    `provinceName` VARCHAR(100) NOT NULL,
    `amphureId` INTEGER NOT NULL,
    `amphureName` VARCHAR(100) NOT NULL,
    `tambonId` INTEGER NOT NULL,
    `tambonName` VARCHAR(100) NOT NULL,
    `zipCode` VARCHAR(10) NOT NULL,
    `deliveryDate` DATE NULL,
    `deliveryTime` VARCHAR(50) NULL,
    `cardMessage` TEXT NULL,
    `additionalNote` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `shipping_info_orderId_key`(`orderId`),
    INDEX `shipping_info_amphureId_fkey`(`amphureId`),
    INDEX `shipping_info_provinceId_fkey`(`provinceId`),
    INDEX `shipping_info_tambonId_fkey`(`tambonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `paymentMethod` ENUM('BANK_TRANSFER', 'CREDIT_CARD', 'PROMPTPAY', 'COD') NOT NULL DEFAULT 'BANK_TRANSFER',
    `paymentDate` DATETIME(0) NULL,
    `transactionId` VARCHAR(100) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `bankName` VARCHAR(100) NULL,
    `slipUrl` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `verifiedBy` BIGINT UNSIGNED NULL,
    `verifiedAt` DATETIME(0) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `payment_info_orderId_key`(`orderId`),
    INDEX `payment_info_verifiedBy_fkey`(`verifiedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_confirmations` (
    `id` VARCHAR(36) NOT NULL,
    `orderNumber` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `bankName` VARCHAR(100) NULL,
    `slipUrl` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `verifiedBy` BIGINT UNSIGNED NULL,
    `verifiedAt` DATETIME(0) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `payment_confirmations_orderNumber_idx`(`orderNumber`),
    INDEX `payment_confirmations_verifiedBy_fkey`(`verifiedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(255) NOT NULL,
    `lastName` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `isAdmin` ENUM('true', 'false') NOT NULL DEFAULT 'false',
    `emailVerifiedAt` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `rememberToken` VARCHAR(100) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `users_email_unique`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_info` ADD CONSTRAINT `customer_info_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipping_info` ADD CONSTRAINT `shipping_info_amphureId_fkey` FOREIGN KEY (`amphureId`) REFERENCES `thaiamphures`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipping_info` ADD CONSTRAINT `shipping_info_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipping_info` ADD CONSTRAINT `shipping_info_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `thaiprovinces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipping_info` ADD CONSTRAINT `shipping_info_tambonId_fkey` FOREIGN KEY (`tambonId`) REFERENCES `thaitambons`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_info` ADD CONSTRAINT `payment_info_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_info` ADD CONSTRAINT `payment_info_verifiedBy_fkey` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_confirmations` ADD CONSTRAINT `payment_confirmations_verifiedBy_fkey` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
