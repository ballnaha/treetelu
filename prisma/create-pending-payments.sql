-- สร้างตาราง pending_payments สำหรับเก็บข้อมูลการชำระเงินที่ยังไม่มี order ในฐานข้อมูล
CREATE TABLE IF NOT EXISTS `pending_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `charge_id` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `metadata` JSON DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `processed` tinyint(1) NOT NULL DEFAULT 0,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `charge_id` (`charge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 