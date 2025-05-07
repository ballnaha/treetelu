-- AlterTable
ALTER TABLE `pending_payments` ADD COLUMN `customer_email` VARCHAR(255) NULL,
                              ADD COLUMN `customer_name` VARCHAR(255) NULL,
                              ADD COLUMN `customer_phone` VARCHAR(50) NULL; 