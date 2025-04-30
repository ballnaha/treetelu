-- CreateTable
CREATE TABLE `blogs` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `excerpt` VARCHAR(500) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `date` VARCHAR(100) NOT NULL,
  `published` BOOLEAN NOT NULL DEFAULT true,
  `userId` INTEGER UNSIGNED NULL,
  `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updatedAt` DATETIME(0) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `blogs_slug_key`(`slug`),
  INDEX `blog_slug_index`(`slug`),
  INDEX `blog_category_index`(`category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; 