-- 企业库存管理系统数据库初始化脚本
-- MySQL 8.0+  中央空调销售公司

CREATE DATABASE IF NOT EXISTS inventory_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_db;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `real_name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100), `phone` VARCHAR(20),
    `status` INT DEFAULT 1,
    `created_at` DATETIME, `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 产品分类表
CREATE TABLE IF NOT EXISTS `product_category` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL, `description` VARCHAR(500),
    `parent_id` BIGINT, `status` INT DEFAULT 1, `created_at` DATETIME,
    FOREIGN KEY (`parent_id`) REFERENCES `product_category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 产品表
CREATE TABLE IF NOT EXISTS `product` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL, `category_id` BIGINT,
    `spec` VARCHAR(200), `unit` VARCHAR(20),
    `cost_price` DECIMAL(12,2), `retail_price` DECIMAL(12,2),
    `stock_quantity` INT DEFAULT 0, `min_stock` INT DEFAULT 0,
    `status` INT DEFAULT 1, `created_at` DATETIME,
    FOREIGN KEY (`category_id`) REFERENCES `product_category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 取货请求表
CREATE TABLE IF NOT EXISTS `pickup_request` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `request_no` VARCHAR(50) NOT NULL UNIQUE,
    `applicant_id` BIGINT NOT NULL, `status` VARCHAR(20) NOT NULL,
    `customer_name` VARCHAR(200), `project_name` VARCHAR(200),
    `total_amount` DECIMAL(14,2), `approved_amount` DECIMAL(14,2),
    `approved_by` BIGINT, `approved_at` DATETIME, `approved_comment` VARCHAR(500),
    `remark` VARCHAR(500), `created_at` DATETIME, `updated_at` DATETIME,
    FOREIGN KEY (`applicant_id`) REFERENCES `user`(`id`),
    FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 请求明细表
CREATE TABLE IF NOT EXISTS `request_item` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `request_id` BIGINT NOT NULL, `product_id` BIGINT NOT NULL,
    `quantity` INT NOT NULL, `unit_price` DECIMAL(12,2) NOT NULL,
    `approved_quantity` INT, `approved_price` DECIMAL(12,2), `subtotal` DECIMAL(14,2),
    FOREIGN KEY (`request_id`) REFERENCES `pickup_request`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_no` VARCHAR(50) NOT NULL UNIQUE,
    `request_id` BIGINT, `sales_id` BIGINT NOT NULL,
    `customer_name` VARCHAR(200), `project_name` VARCHAR(200),
    `total_amount` DECIMAL(14,2), `actual_amount` DECIMAL(14,2),
    `order_date` DATE, `status` VARCHAR(20) NOT NULL,
    `remark` VARCHAR(500), `created_at` DATETIME,
    FOREIGN KEY (`request_id`) REFERENCES `pickup_request`(`id`),
    FOREIGN KEY (`sales_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 库存变动表
CREATE TABLE IF NOT EXISTS `inventory_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL, `order_id` BIGINT,
    `change_type` VARCHAR(20) NOT NULL, `quantity` INT NOT NULL,
    `before_quantity` INT NOT NULL, `after_quantity` INT NOT NULL,
    `operator_id` BIGINT, `remark` VARCHAR(500), `created_at` DATETIME,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
    FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 索引
CREATE INDEX idx_user_role ON `user`(`role`);
CREATE INDEX idx_request_applicant ON pickup_request(`applicant_id`);
CREATE INDEX idx_request_status ON pickup_request(`status`);
CREATE INDEX idx_order_sales ON orders(`sales_id`);
CREATE INDEX idx_order_date ON orders(`order_date`);
