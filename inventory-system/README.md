# 企业库存管理系统 (Enterprise Inventory Management System)

## 📋 项目简介

一个面向销售型企业的库存管理系统，支持取货请求管理、订单处理、销售统计等核心业务流程。

### 主要功能

- **用户管理**：支持销售和经理两种角色
- **产品管理**：产品分类、产品信息、库存管理
- **取货请求**：销售提交取货请求，经理审批
- **订单管理**：订单创建、成交记录、金额统计
- **货仓统计**：实时库存查询、库存预警、变动记录
- **统计报表**：月度汇总、销售业绩、公司概况

## 🛠 技术栈

| 技术 | 版本 |
|------|------|
| Java | 17+ |
| Spring Boot | 3.2.x |
| Spring Data JPA | - |
| Spring Security | - |
| Thymeleaf | - |
| Bootstrap | 5.3.x |
| MySQL | 8.0+ |
| Maven | 3.8+ |

## 🚀 本地部署

### 环境要求

- JDK 17 或更高版本
- MySQL 8.0 或更高版本
- Maven 3.8 或更高版本

### 步骤 1：安装 MySQL 并创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE inventory_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_db;

# 执行数据库初始化脚本（可选，系统会自动创建表）
# source database/init.sql
```

### 步骤 2：修改数据库配置

编辑 `src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/inventory_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false
    username: root          # 修改为你的数据库用户名
    password: your_password  # 修改为你的数据库密码
```

### 步骤 3：编译和运行

```bash
# 进入项目目录
cd inventory-system

# 编译项目
mvn clean compile

# 运行项目
mvn spring-boot:run
```

### 步骤 4：访问系统

打开浏览器访问：http://localhost:8080

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 经理 | manager | 123456 |
| 销售 | sales1 | 123456 |
| 销售 | sales2 | 123456 |

## 📁 项目结构

```
inventory-system/
├── src/main/java/com/company/inventory/
│   ├── InventoryApplication.java      # 启动类
│   ├── config/                        # 配置类
│   ├── controller/                     # 控制器
│   ├── service/                        # 服务层
│   ├── repository/                     # 数据访问层
│   ├── entity/                          # 实体类
│   ├── enums/                          # 枚举类
│   └── dto/                            # 数据传输对象
├── src/main/resources/
│   ├── application.yml                 # 应用配置
│   └── templates/                       # Thymeleaf 模板
├── src/test/java/                      # 测试类
├── database/
│   └── init.sql                        # 数据库初始化脚本
├── pom.xml                             # Maven 配置
└── README.md
```

## 📊 功能流程

### 取货请求流程

```
销售创建请求 → 经理审核 → [同意/拒绝/调整] → 销售确认 → 成交
```

### 角色权限

| 功能 | 销售 | 经理 |
|------|------|------|
| 工作台 | ✓ | ✓ |
| 创建取货请求 | ✓ | ✓ |
| 审核请求 | - | ✓ |
| 创建订单 | ✓ | ✓ |
| 产品管理 | 只读 | 读写 |
| 用户管理 | - | ✓ |
| 统计报表 | 个人 | 全部 |

## 🐛 常见问题

### 1. 编译报错：找不到符号

确保已安装 JDK 17+，并配置 JAVA_HOME 环境变量。

### 2. 数据库连接失败

- 检查 MySQL 服务是否启动
- 确认数据库用户名和密码正确
- 确认数据库已创建

### 3. 端口被占用

修改 `application.yml` 中的 `server.port` 为其他端口。

## 📝 许可证

本项目仅供学习参考使用。

## 🤝 联系方式

如有问题，请联系系统管理员。
