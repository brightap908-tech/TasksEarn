-- Database Schema for TasksEarn Microtask Platform
-- Inspired by FamsUp Tasks
-- Target: MySQL 5.7+ or 8.0+

CREATE DATABASE IF NOT EXISTS `tasksearn_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tasksearn_db`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Earner', 'Advertiser', 'Admin') NOT NULL DEFAULT 'Earner',
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `wallet_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `referral_code` VARCHAR(50) NULL,
  `referred_by` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_referral` (`referral_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TASKS (CAMPAIGNS) TABLE
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `proof_requirements` TEXT NOT NULL,
  `link` VARCHAR(255) NOT NULL,
  `cost_per_slot` DECIMAL(10, 2) NOT NULL,
  `earning_per_slot` DECIMAL(10, 2) NOT NULL,
  `total_slots` INT NOT NULL,
  `filled_slots` INT NOT NULL DEFAULT 0,
  `status` ENUM('Active', 'Paused', 'Completed', 'Pending Approval') NOT NULL DEFAULT 'Active',
  `advertiser_id` VARCHAR(50) NOT NULL,
  `advertiser_name` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`advertiser_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` VARCHAR(50) NOT NULL,
  `task_id` VARCHAR(50) NOT NULL,
  `task_title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `earner_id` VARCHAR(50) NOT NULL,
  `earner_name` VARCHAR(150) NOT NULL,
  `proof_text` TEXT NOT NULL,
  `proof_screenshot` VARCHAR(255) NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `feedback` TEXT NULL,
  `reward` DECIMAL(10, 2) NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`earner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `type` ENUM('Deposit', 'Withdrawal', 'Task Earnings', 'Campaign Spend', 'Referral Bonus') NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected', 'Success', 'Failed') NOT NULL DEFAULT 'Pending',
  `description` VARCHAR(255) NOT NULL,
  `reference` VARCHAR(100) NOT NULL UNIQUE,
  `gateway` VARCHAR(50) NULL,
  `bank_details` JSON NULL, -- Stores bankName, accountNumber, accountName for withdrawal requests
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. REFERRALS RELATION TABLE
CREATE TABLE IF NOT EXISTS `referrals` (
  `id` VARCHAR(50) NOT NULL,
  `referrer_id` VARCHAR(50) NOT NULL,
  `referee_id` VARCHAR(50) NOT NULL,
  `referee_name` VARCHAR(150) NOT NULL,
  `referee_email` VARCHAR(150) NOT NULL,
  `reward_earned` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`referee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `type` ENUM('info', 'success', 'warning') NOT NULL DEFAULT 'info',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BANNERS TABLE
CREATE TABLE IF NOT EXISTS `banners` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `link` VARCHAR(255) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CMS PAGES TABLE
CREATE TABLE IF NOT EXISTS `pages` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. WEBSITE SYSTEM CONFIG TABLE
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL AUTO_0_INCREMENT,
  `platform_name` VARCHAR(100) NOT NULL DEFAULT 'TasksEarn',
  `referral_reward` DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
  `withdrawal_fee` DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  `min_withdrawal` DECIMAL(10, 2) NOT NULL DEFAULT 2000.00,
  `min_deposit` DECIMAL(10, 2) NOT NULL DEFAULT 1000.00,
  `contact_email` VARCHAR(150) NOT NULL DEFAULT 'support@tasksearn.com',
  `contact_phone` VARCHAR(50) NOT NULL DEFAULT '+234 812 345 6789',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------------
-- INITIAL SEED RECORDS FOR TESTING PRODUCTION INSTANTLY
-- -------------------------------------------------------------

-- Core settings
INSERT INTO `settings` (`id`, `platform_name`, `referral_reward`, `withdrawal_fee`, `min_withdrawal`, `min_deposit`, `contact_email`, `contact_phone`)
VALUES (1, 'TasksEarn', 200.00, 100.00, 2000.00, 1000.00, 'support@tasksearn.com', '+234 812 345 6789');

-- Default CMS pages
INSERT INTO `pages` (`id`, `title`, `content`) VALUES
('about', 'About TasksEarn', 'TasksEarn is Nigeria''s premier microtask marketplace designed to bridge the gap between digital content advertisers and micro-job earners. Built to support digital marketers, small business owners, and online earners across Nigeria, we enable seamless social media engagements on platforms like Facebook, Instagram, TikTok, YouTube, WhatsApp, and Telegram.'),
('contact', 'Contact Us', 'Have questions, disputes, or looking to discuss custom high-volume ad packages? Our friendly support team is here to assist you 24/7 via support@tasksearn.com or +234 812 345 6789.'),
('faq', 'Frequently Asked Questions', 'FAQ lists are managed dynamically through the platform panels.'),
('terms', 'Terms of Service', 'Welcome to TasksEarn. By using this service you agree to our terms of social media integrity, single-account restrictions, and withdrawal processing parameters.'),
('privacy', 'Privacy Policy', 'Your personal account handles, email coordinates, and screenshot verification proofs are stored securely and never traded with marketing platforms.');

-- Admin Seed (password hash is sha256 of 'admin123' -> 240be518abb28c08eb0e14d16853a209302f234cc51280389f41de60eb009212)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_verified`, `wallet_balance`) VALUES
('u-admin-1', 'Super Admin', 'admin@tasksearn.com', '240be518abb28c08eb0e14d16853a209302f234cc51280389f41de60eb009212', 'Admin', 1, 0.00);

-- Earner Seed (password hash is sha256 of 'password123' -> ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_verified`, `wallet_balance`, `referral_code`) VALUES
('u-earner-1', 'Tunde Bakare', 'earner@tasksearn.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Earner', 1, 2500.00, 'TUNDE887');

-- Advertiser Seed
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_verified`, `wallet_balance`) VALUES
('u-advertiser-1', 'Chinedu Okafor', 'advertiser@tasksearn.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Advertiser', 1, 35000.00);

-- Banners
INSERT INTO `banners` (`id`, `title`, `image_url`, `link`, `active`) VALUES
('ban-1', 'Boost Your Social Media Reach Instantly', 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200', '/advertiser/dashboard', 1);
