-- ============================================================
-- 企业库存管理系统 · 数据库结构定义脚本
-- 系统：中央空调销售公司库存管理
-- MySQL 8.0+
-- 生成时间：2026-04-09
-- ============================================================

-- 建库
CREATE DATABASE IF NOT EXISTS `inventory_db`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `inventory_db`;

-- ============================================================
-- 1. 用户表
--    对应实体: User.java
--    角色枚举: MANAGER / SALES (UserRole.java)
-- ============================================================
CREATE TABLE IF NOT EXISTS `user` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `username`   VARCHAR(50)  NOT NULL COMMENT '登录账号',
    `password`   VARCHAR(255) NOT NULL COMMENT 'BCrypt 加密密码',
    `real_name`  VARCHAR(100) NOT NULL COMMENT '真实姓名',
    `role`       VARCHAR(20)  NOT NULL COMMENT '角色: MANAGER | SALES',
    `email`      VARCHAR(100)          COMMENT '邮箱',
    `phone`      VARCHAR(20)           COMMENT '手机号',
    `status`     INT          NOT NULL DEFAULT 1 COMMENT '状态: 1=启用 0=禁用',
    `created_at` DATETIME              COMMENT '创建时间',
    `updated_at` DATETIME              COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. 产品分类表
--    对应实体: ProductCategory.java
--    支持无限级分类（parent_id 自引用）
-- ============================================================
CREATE TABLE IF NOT EXISTS `product_category` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`        VARCHAR(100) NOT NULL COMMENT '分类名称',
    `description` VARCHAR(500)          COMMENT '分类描述',
    `parent_id`   BIGINT                COMMENT '父分类ID，NULL表示顶级',
    `status`      INT          NOT NULL DEFAULT 1 COMMENT '状态: 1=启用 0=禁用',
    `created_at`  DATETIME              COMMENT '创建时间',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_category_parent`
        FOREIGN KEY (`parent_id`) REFERENCES `product_category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品分类表';

-- ============================================================
-- 3. 产品表
--    对应实体: Product.java
-- ============================================================
CREATE TABLE IF NOT EXISTS `product` (
    `id`             BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键',
    `name`           VARCHAR(200)   NOT NULL COMMENT '产品名称',
    `category_id`    BIGINT                  COMMENT '所属分类ID',
    `spec`           VARCHAR(200)            COMMENT '规格型号',
    `unit`           VARCHAR(20)             COMMENT '计量单位',
    `cost_price`     DECIMAL(12, 2)          COMMENT '成本价（元）',
    `retail_price`   DECIMAL(12, 2)          COMMENT '零售价（元）',
    `stock_quantity` INT            NOT NULL DEFAULT 0 COMMENT '当前库存数量',
    `min_stock`      INT            NOT NULL DEFAULT 0 COMMENT '最低库存预警数量',
    `status`         INT            NOT NULL DEFAULT 1 COMMENT '状态: 1=上架 0=下架',
    `created_at`     DATETIME                COMMENT '创建时间',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_product_category`
        FOREIGN KEY (`category_id`) REFERENCES `product_category`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品表';

-- ============================================================
-- 4. 取货请求表（销售申请单）
--    对应实体: PickupRequest.java
--    状态枚举: PENDING | APPROVED | REJECTED | ADJUSTED | COMPLETED | CANCELLED
-- ============================================================
CREATE TABLE IF NOT EXISTS `pickup_request` (
    `id`               BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键',
    `request_no`       VARCHAR(50)    NOT NULL COMMENT '申请单号',
    `applicant_id`     BIGINT         NOT NULL COMMENT '申请人ID（销售）',
    `status`           VARCHAR(20)    NOT NULL COMMENT '状态枚举值',
    `customer_name`    VARCHAR(200)            COMMENT '客户名称',
    `project_name`     VARCHAR(200)            COMMENT '项目名称',
    `total_amount`     DECIMAL(14, 2)          COMMENT '申请总金额（元）',
    `approved_amount`  DECIMAL(14, 2)          COMMENT '审批通过金额（元）',
    `approved_by`      BIGINT                  COMMENT '审批人ID',
    `approved_at`      DATETIME                COMMENT '审批时间',
    `approved_comment` VARCHAR(500)            COMMENT '审批意见',
    `remark`           VARCHAR(500)            COMMENT '申请备注',
    `created_at`       DATETIME                COMMENT '创建时间',
    `updated_at`       DATETIME                COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_request_no` (`request_no`),
    CONSTRAINT `fk_request_applicant`
        FOREIGN KEY (`applicant_id`) REFERENCES `user`(`id`),
    CONSTRAINT `fk_request_approver`
        FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='取货申请单';

-- ============================================================
-- 5. 申请单明细表
--    对应实体: RequestItem.java
-- ============================================================
CREATE TABLE IF NOT EXISTS `request_item` (
    `id`                BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键',
    `request_id`        BIGINT         NOT NULL COMMENT '所属申请单ID',
    `product_id`        BIGINT         NOT NULL COMMENT '产品ID',
    `quantity`          INT            NOT NULL COMMENT '申请数量',
    `unit_price`        DECIMAL(12, 2) NOT NULL COMMENT '申请单价（元）',
    `approved_quantity` INT                     COMMENT '审批通过数量',
    `approved_price`    DECIMAL(12, 2)          COMMENT '审批通过单价（元）',
    `subtotal`          DECIMAL(14, 2)          COMMENT '小计（元）',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_item_request`
        FOREIGN KEY (`request_id`) REFERENCES `pickup_request`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_product`
        FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='申请单明细';

-- ============================================================
-- 6. 订单表
--    对应实体: Order.java
--    状态枚举: PENDING | CONFIRMED | COMPLETED | CANCELLED
-- ============================================================
CREATE TABLE IF NOT EXISTS `orders` (
    `id`            BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键',
    `order_no`      VARCHAR(50)    NOT NULL COMMENT '订单号',
    `request_id`    BIGINT                  COMMENT '来源申请单ID（可为NULL表示直接开单）',
    `sales_id`      BIGINT         NOT NULL COMMENT '销售员ID',
    `customer_name` VARCHAR(200)            COMMENT '客户名称',
    `project_name`  VARCHAR(200)            COMMENT '项目名称',
    `total_amount`  DECIMAL(14, 2)          COMMENT '订单总额（元）',
    `actual_amount` DECIMAL(14, 2)          COMMENT '实际成交金额（元）',
    `order_date`    DATE                    COMMENT '下单日期',
    `status`        VARCHAR(20)    NOT NULL COMMENT '状态枚举值',
    `remark`        VARCHAR(500)            COMMENT '备注',
    `created_at`    DATETIME                COMMENT '创建时间',
    `completed_at`  DATETIME                COMMENT '完成时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    CONSTRAINT `fk_order_request`
        FOREIGN KEY (`request_id`) REFERENCES `pickup_request`(`id`),
    CONSTRAINT `fk_order_sales`
        FOREIGN KEY (`sales_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售订单';

-- ============================================================
-- 7. 库存变动日志表
--    对应实体: InventoryLog.java
--    变动类型枚举: IN（入库）| OUT（出库）| ADJUST（调整）
-- ============================================================
CREATE TABLE IF NOT EXISTS `inventory_log` (
    `id`              BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    `product_id`      BIGINT      NOT NULL COMMENT '产品ID',
    `order_id`        BIGINT               COMMENT '关联订单ID（可为NULL）',
    `change_type`     VARCHAR(20) NOT NULL COMMENT '变动类型: IN | OUT | ADJUST',
    `quantity`        INT         NOT NULL COMMENT '变动数量（正数入库，负数出库）',
    `before_quantity` INT         NOT NULL COMMENT '变动前库存',
    `after_quantity`  INT         NOT NULL COMMENT '变动后库存',
    `operator_id`     BIGINT               COMMENT '操作人ID',
    `remark`          VARCHAR(500)         COMMENT '备注',
    `created_at`      DATETIME             COMMENT '记录时间',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_log_product`
        FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
    CONSTRAINT `fk_log_order`
        FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
    CONSTRAINT `fk_log_operator`
        FOREIGN KEY (`operator_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存变动日志';

-- ============================================================
-- 索引（性能优化）
-- ============================================================
CREATE INDEX `idx_user_role`         ON `user`(`role`);
CREATE INDEX `idx_user_status`       ON `user`(`status`);
CREATE INDEX `idx_product_category`  ON `product`(`category_id`);
CREATE INDEX `idx_product_status`    ON `product`(`status`);
CREATE INDEX `idx_product_stock`     ON `product`(`stock_quantity`);
CREATE INDEX `idx_request_applicant` ON `pickup_request`(`applicant_id`);
CREATE INDEX `idx_request_status`    ON `pickup_request`(`status`);
CREATE INDEX `idx_request_created`   ON `pickup_request`(`created_at`);
CREATE INDEX `idx_order_sales`       ON `orders`(`sales_id`);
CREATE INDEX `idx_order_status`      ON `orders`(`status`);
CREATE INDEX `idx_order_date`        ON `orders`(`order_date`);
CREATE INDEX `idx_log_product`       ON `inventory_log`(`product_id`);
CREATE INDEX `idx_log_created`       ON `inventory_log`(`created_at`);
