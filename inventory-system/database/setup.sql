-- ============================================================
-- 企业库存管理系统 · 一键初始化脚本
-- 用法：mysql -u root -p < setup.sql
--       或在 MySQL Workbench / Navicat 中执行本文件
--
-- 执行顺序：
--   1. schema.sql      建库 + 建表 + 索引
--   2. data.sql        用户 + 产品分类 + 产品 + 库存初始日志
--   3. request_data.sql 申请单 + 明细 + 订单 + 出入库日志
-- ============================================================

SOURCE schema.sql;
SOURCE data.sql;
SOURCE request_data.sql;

-- ============================================================
-- 验证：输出各表数据量
-- ============================================================
SELECT '=== 数据库初始化完成 ===' AS message;

SELECT
    'user'             AS `表名`, COUNT(*) AS `行数` FROM `user`
UNION ALL SELECT
    'product_category' AS `表名`, COUNT(*) AS `行数` FROM `product_category`
UNION ALL SELECT
    'product'          AS `表名`, COUNT(*) AS `行数` FROM `product`
UNION ALL SELECT
    'pickup_request'   AS `表名`, COUNT(*) AS `行数` FROM `pickup_request`
UNION ALL SELECT
    'request_item'     AS `表名`, COUNT(*) AS `行数` FROM `request_item`
UNION ALL SELECT
    'orders'           AS `表名`, COUNT(*) AS `行数` FROM `orders`
UNION ALL SELECT
    'inventory_log'    AS `表名`, COUNT(*) AS `行数` FROM `inventory_log`;
