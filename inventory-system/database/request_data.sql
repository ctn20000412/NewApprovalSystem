-- ============================================================
-- 企业库存管理系统 · 取货申请与订单示例数据
-- 请先执行 schema.sql 和 data.sql 再执行本脚本
-- ============================================================

USE `inventory_db`;

-- ============================================================
-- 1. 取货申请单（6条，覆盖所有状态）
--    RequestStatus: PENDING | APPROVED | REJECTED | ADJUSTED | COMPLETED | CANCELLED
--    user id: 1=manager, 2=sales1(李销售), 3=sales2(王销售), 4=sales3(赵销售)
-- ============================================================
INSERT INTO `pickup_request` (`request_no`, `applicant_id`, `status`, `customer_name`, `project_name`,
    `total_amount`, `approved_amount`, `approved_by`, `approved_at`, `approved_comment`, `remark`, `created_at`, `updated_at`) VALUES
-- 待审核
('REQ20260409001', 2, 'PENDING',   '华强商业广场', '商业综合体中央空调项目',
    186800, NULL,   NULL, NULL,                         NULL,         '客户要求15天内完成',
    NOW(),                        NOW()),
('REQ20260409002', 3, 'PENDING',   '创新写字楼物业', '写字楼老楼改造',
    42800,  NULL,   NULL, NULL,                         NULL,         '旧楼改造，预算有限',
    NOW(),                        NOW()),
-- 已审批
('REQ20260408001', 2, 'APPROVED',  '华联电子工业园', '厂房恒温恒湿项目',
    358000, 345000, 1,   NOW() - INTERVAL 1 DAY,  '同意，按调整后价格执行', '大型项目，需提前备货',
    NOW() - INTERVAL 1 DAY,      NOW() - INTERVAL 1 DAY),
('REQ20260407001', 3, 'APPROVED',  '明天科技大厦',   '办公楼宇新风系统改造',
    98600,  96800,  1,   NOW() - INTERVAL 2 DAY,  '同意，价格微调',         '长期客户，优先处理',
    NOW() - INTERVAL 2 DAY,      NOW() - INTERVAL 2 DAY),
-- 已拒绝
('REQ20260405001', 2, 'REJECTED',  '小微企业孵化园', '初创企业办公区空调',
    45000,  NULL,   1,   NOW() - INTERVAL 4 DAY,  '建议改用风冷热泵，成本更低', '预算不足',
    NOW() - INTERVAL 4 DAY,      NOW() - INTERVAL 4 DAY),
-- 已完成
('REQ20260401001', 2, 'COMPLETED', '华鑫购物中心',   '商场中央空调全套工程',
    520000, 505000, 1,   NOW() - INTERVAL 7 DAY,  '同意，项目顺利交付',     '大型商业项目',
    NOW() - INTERVAL 10 DAY,     NOW() - INTERVAL 5 DAY);

-- ============================================================
-- 2. 申请单明细（对应上方6条申请单）
--    request_id 按照上面插入顺序：1~6
-- ============================================================
INSERT INTO `request_item` (`request_id`, `product_id`, `quantity`, `unit_price`, `approved_quantity`, `approved_price`, `subtotal`) VALUES
-- REQ20260409001 (id=1): 商业综合体
(1, 1,  1,  88000, NULL, NULL, 88000),
(1, 12, 20, 1680,  NULL, NULL, 33600),
(1, 13, 15, 1980,  NULL, NULL, 29700),
(1, 18, 8,  2980,  NULL, NULL, 23800),
(1, 33, 50, 180,   NULL, NULL, 9000),
-- REQ20260409002 (id=2): 写字楼改造
(2, 12, 10, 1680,  NULL, NULL, 16800),
(2, 13, 8,  1980,  NULL, NULL, 15840),
(2, 19, 1,  11800, NULL, NULL, 11800),
-- REQ20260408001 (id=3): 工业园恒温（已审批，有核价）
(3, 10, 2,  218000, 2,  210000, 436000),
(3, 12, 50, 1680,   50, 1600,   84000),
(3, 19, 3,  24800,  3,  23500,  74400),
-- REQ20260407001 (id=4): 写字楼新风（已审批，有核价）
(4, 12, 25, 1980,  25, 1920, 49500),
(4, 13, 15, 2280,  15, 2200, 34200),
-- REQ20260405001 (id=5): 小微园（已拒绝）
(5, 10, 1,  128000, NULL, NULL, 128000),
(5, 12, 20, 1680,   NULL, NULL, 33600),
-- REQ20260401001 (id=6): 购物中心（已完成）
(6, 3,  2,  238000, 2,  230000, 476000),
(6, 12, 80, 1680,   80, 1600,   134400),
(6, 19, 5,  24800,  5,  24000,  124000);

-- ============================================================
-- 3. 订单数据
--    OrderStatus: PENDING | CONFIRMED | COMPLETED | CANCELLED
-- ============================================================
INSERT INTO `orders` (`order_no`, `request_id`, `sales_id`, `customer_name`, `project_name`,
    `total_amount`, `actual_amount`, `order_date`, `status`, `remark`, `created_at`) VALUES
-- 已完成订单（对应已完成的申请单6）
('ORD20260401001', 6, 2, '华鑫购物中心', '商场中央空调全套工程',
    520000, 505000, CURDATE() - INTERVAL 5 DAY,
    'COMPLETED', '项目顺利交付，客户满意',
    NOW() - INTERVAL 5 DAY),
-- 已确认订单（对应已审批的申请单3）
('ORD20260408001', 3, 2, '华联电子工业园', '厂房恒温恒湿项目',
    594400, 594400, CURDATE() - INTERVAL 1 DAY,
    'CONFIRMED', '按审批价格开单，已安排发货',
    NOW() - INTERVAL 1 DAY),
-- 待确认订单（对应已审批的申请单4）
('ORD20260409001', 4, 3, '明天科技大厦', '办公楼宇新风系统改造',
    83700, NULL, CURDATE(),
    'PENDING', '等待客户确认最终方案',
    NOW());

-- ============================================================
-- 4. 出库库存日志（对应已完成订单 ORD20260401001）
--    ChangeType 枚举值: IN | OUT | ADJUST
-- ============================================================
INSERT INTO `inventory_log` (`product_id`, `order_id`, `change_type`, `quantity`, `before_quantity`, `after_quantity`, `operator_id`, `remark`, `created_at`) VALUES
-- 订单1（id=1）出库：产品3（520kW模块机）、产品12（FP-34风机盘管）、产品19（3000m³/h机组）
(3,  1, 'OUT', -2,  5,  3,  1, '订单 ORD20260401001 出库', NOW() - INTERVAL 5 DAY),
(12, 1, 'OUT', -80, 85, 5,  2, '订单 ORD20260401001 出库', NOW() - INTERVAL 5 DAY),
(19, 1, 'OUT', -5,  12, 7,  2, '订单 ORD20260401001 出库', NOW() - INTERVAL 5 DAY),
-- 补货入库
(12, NULL, 'IN', 70, 5, 75, 1, '风机盘管补货入库', NOW() - INTERVAL 3 DAY),
(19, NULL, 'IN', 5,  7, 12, 1, '空气处理机组补货入库', NOW() - INTERVAL 3 DAY);
