# 记忆文件

## 项目信息

### inventory-system (Java Spring Boot 库存管理系统)
- **路径**: `e:/code/workbuddy/System/inventory-system`
- **类型**: Java Spring Boot + Thymeleaf + MySQL
- **端口**: 8080
- **数据库**: MySQL inventory_db (root/Ning.0412)

### inventory-app (React前端库存管理系统)
- **路径**: `e:/code/workbuddy/System/inventory-app`
- **类型**: React + TypeScript + Vite + Tailwind CSS
- **端口**: 5173
- **状态**: 前后端分离版本

## 技术栈

### Java项目 (inventory-system)
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security
- Thymeleaf
- MySQL
- Lombok 1.18.36（支持JDK 23）
- Java 23 (使用系统默认JDK 23编译，Lombok需1.18.36+)

### 启动命令
```powershell
# 使用系统默认 JDK 23（需确保 Lombok 1.18.36）
cd e:/code/workbuddy/System/inventory-system
mvn spring-boot:run
```

## 数据库脚本（2026-04-09 更新）
```
database/
├── schema.sql       # 建库+建表+索引（7张表）
├── data.sql         # 用户+分类+产品+库存初始日志
├── request_data.sql # 申请单+明细+订单+出入库日志
└── setup.sql        # 一键导入入口（SOURCE 3个脚本 + 验证）
```
- 初始账号：manager / sales1 / sales2 / sales3，密码均为 123456
- BCrypt 哈希：`$2b$10$ZIyh7Ays8udEush7CcGBWe4BcOxMZEAw0Wlg2LaS1KHtF2fyo5bce`

## 用户信息
- 用户数据库配置: root / Ning.0412
- 初始密码: 123456 (BCrypt加密)

## 项目结构
```
inventory-system/
├── database/
│   ├── init.sql          # 表结构
│   ├── data.sql          # 基础数据
│   └── request_data.sql  # 请求订单数据
├── src/main/java/com/company/inventory/
│   ├── config/           # 配置类
│   ├── controller/       # 控制器
│   ├── entity/           # 实体类
│   ├── enums/            # 枚举
│   ├── repository/       # 数据访问层
│   └── service/          # 业务逻辑
└── src/main/resources/
    ├── application.yml    # 配置文件
    └── templates/        # Thymeleaf模板
```
