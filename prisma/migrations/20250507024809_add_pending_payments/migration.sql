-- CreateTable
CREATE TABLE `pending_payments` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `charge_id` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `metadata` JSON NULL,
  `order_id` INTEGER NULL,
  `processed` BOOLEAN NOT NULL DEFAULT false,
  `processed_at` DATETIME(0) NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL,

  UNIQUE INDEX `pending_payments_charge_id_key`(`charge_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 