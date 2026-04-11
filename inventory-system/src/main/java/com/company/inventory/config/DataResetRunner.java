package com.company.inventory.config;

import com.company.inventory.entity.Product;
import com.company.inventory.entity.ProductCategory;
import com.company.inventory.entity.User;
import com.company.inventory.entity.InventoryLog;
import com.company.inventory.enums.ChangeType;
import com.company.inventory.enums.UserRole;
import com.company.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataResetRunner implements CommandLineRunner {
    
    // 设置为true时会在启动时重置所有数据
    private static final boolean RESET_ON_STARTUP = false;
    
    private final UserRepository userRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PickupRequestRepository requestRepository;
    private final RequestItemRepository itemRepository;
    private final OrderRepository orderRepository;
    private final InventoryLogRepository logRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) {
        if (!RESET_ON_STARTUP) {
            return;
        }
        
        log.info("===========================================");
        log.info("开始重置数据库数据...");
        
        // 按外键依赖顺序删除数据
        try {
            logRepository.deleteAll();
            notificationRepository.deleteAll();
            orderRepository.deleteAll();
            itemRepository.deleteAll();
            requestRepository.deleteAll();
            productRepository.deleteAll();
            
            // 先删除子分类
            categoryRepository.findAll().forEach(cat -> {
                if (cat.getParent() != null) {
                    categoryRepository.delete(cat);
                }
            });
            // 再删除主分类
            categoryRepository.findByParentIsNull().forEach(cat -> {
                categoryRepository.delete(cat);
            });
            
            // 最后删除用户
            userRepository.deleteAll();
            
            log.info("已清空所有表数据");
        } catch (Exception e) {
            log.error("清空数据失败: {}", e.getMessage());
        }
        
        // 初始化用户
        log.info("初始化用户数据...");
        createUser("manager", "123456", "张经理", UserRole.MANAGER, "13800138000");
        createUser("sales1", "123456", "李销售", UserRole.SALES, "13800138001");
        createUser("sales2", "123456", "王销售", UserRole.SALES, "13800138002");
        createUser("sales3", "123456", "赵销售", UserRole.SALES, "13800138003");
        log.info("用户创建完成");
        
        // 创建主分类
        log.info("创建产品分类...");
        ProductCategory main1 = createCategory("主机设备", "中央空调主机产品", null);
        ProductCategory main2 = createCategory("末端设备", "风机盘管、空气处理机组等", null);
        ProductCategory main3 = createCategory("通风设备", "风机、风管等通风产品", null);
        ProductCategory main4 = createCategory("控制系统", "空调控制系统及配件", null);
        ProductCategory main5 = createCategory("管路配件", "铜管、保温材料等", null);
        ProductCategory main6 = createCategory("安装辅材", "支架、吊架等安装材料", null);
        
        // 子分类
        createCategory("模块机", "模块化冷水机组", main1);
        createCategory("风冷热泵", "风冷热泵机组", main1);
        createCategory("水冷螺杆", "水冷螺杆机组", main1);
        createCategory("风机盘管", "卧式/立式风机盘管", main2);
        createCategory("空气处理机组", "组合式空气处理机组", main2);
        createCategory("新风机", "新风换气机组", main2);
        createCategory("消防排烟", "消防排烟风机", main3);
        
        // 创建产品
        log.info("创建中央空调产品...");
        
        // 模块机
        createProduct("模块化冷水机组", main1, "130kW 涡旋式", "台", 68000, 88000, 8, 2);
        createProduct("模块化冷水机组", main1, "260kW 涡旋式", "台", 98000, 128000, 5, 1);
        createProduct("模块化冷水机组", main1, "520kW 2模块", "台", 185000, 238000, 3, 1);
        createProduct("变频模块机", main1, "130kW 变频", "台", 85000, 115000, 6, 2);
        
        // 风冷热泵
        createProduct("风冷热泵机组", main1, "80kW", "台", 95000, 128000, 6, 2);
        createProduct("风冷热泵机组", main1, "120kW", "台", 135000, 178000, 4, 1);
        createProduct("风冷热泵机组", main1, "200kW", "台", 210000, 275000, 3, 1);
        createProduct("超低温风冷热泵", main1, "80kW -25℃", "台", 115000, 158000, 4, 1);
        
        // 水冷螺杆
        createProduct("水冷螺杆机组", main1, "350kW 单螺杆", "台", 168000, 218000, 4, 1);
        createProduct("水冷螺杆机组", main1, "500kW 单螺杆", "台", 225000, 295000, 3, 1);
        createProduct("水冷螺杆机组", main1, "700kW 双螺杆", "台", 320000, 420000, 2, 1);
        
        // 风机盘管
        createProduct("卧式暗装风机盘管", main2, "FP-34 3400m³/h 2排管", "台", 1200, 1680, 85, 20);
        createProduct("卧式暗装风机盘管", main2, "FP-51 5100m³/h 2排管", "台", 1450, 1980, 75, 20);
        createProduct("卧式暗装风机盘管", main2, "FP-68 6800m³/h 2排管", "台", 1680, 2280, 60, 15);
        createProduct("卧式暗装风机盘管", main2, "FP-85 8500m³/h 3排管", "台", 1950, 2680, 50, 10);
        createProduct("卧式暗装风机盘管", main2, "FP-102 10200m³/h 3排管", "台", 2350, 3180, 40, 10);
        createProduct("立式明装风机盘管", main2, "FP-34LM 3400m³/h", "台", 1450, 1980, 45, 10);
        createProduct("卡式风机盘管", main2, "FP-68KA 四出风", "台", 2200, 2980, 35, 8);
        
        // 空气处理机组
        createProduct("组合式空气处理机组", main2, "3000m³/h", "台", 8500, 11800, 12, 3);
        createProduct("组合式空气处理机组", main2, "5000m³/h", "台", 12500, 16800, 10, 3);
        createProduct("组合式空气处理机组", main2, "8000m³/h", "台", 18500, 24800, 8, 2);
        createProduct("组合式空气处理机组", main2, "12000m³/h", "台", 28000, 37500, 5, 2);
        
        // 新风机
        createProduct("新风换气机组", main2, "500m³/h 热回收", "台", 6800, 9200, 15, 4);
        createProduct("新风换气机组", main2, "1000m³/h 热回收", "台", 9800, 13500, 12, 3);
        createProduct("新风换气机组", main2, "2000m³/h 热回收", "台", 15800, 21800, 8, 2);
        
        // 消防排烟
        createProduct("消防排烟风机", main3, "HTF-I-5 5000m³/h", "台", 2800, 3800, 25, 6);
        createProduct("消防排烟风机", main3, "HTF-I-8 8000m³/h", "台", 4200, 5600, 20, 5);
        createProduct("消防排烟风机", main3, "HTF-I-12 12000m³/h", "台", 5800, 7800, 15, 4);
        
        // 控制系统
        createProduct("中央空调控制面板", main4, "LCD液晶 联网型", "个", 380, 580, 120, 30);
        createProduct("中央空调控制面板", main4, "触摸屏 彩色", "个", 680, 980, 80, 20);
        createProduct("网关模块", main4, "BACnet/Modbus", "个", 850, 1280, 40, 10);
        
        // 管路配件
        createProduct("分歧器 二分歧", main5, "冷媒分歧器", "个", 120, 180, 200, 50);
        createProduct("分歧器 四分歧", main5, "冷媒分歧器", "个", 180, 280, 150, 40);
        createProduct("分歧器 七分歧", main5, "冷媒分歧器", "个", 320, 480, 80, 20);
        createProduct("保温铜管 Φ6.35mm", main5, "0.8mm厚", "米", 12, 18, 5000, 1000);
        createProduct("保温铜管 Φ9.52mm", main5, "0.8mm厚", "米", 15, 22, 4500, 1000);
        createProduct("保温铜管 Φ12.7mm", main5, "1.0mm厚", "米", 22, 32, 4000, 800);
        createProduct("保温铜管 Φ15.88mm", main5, "1.0mm厚", "米", 28, 42, 3500, 700);
        createProduct("保温橡塑", main5, "Φ6-25mm", "米", 3.5, 5.5, 8000, 2000);
        
        // 安装辅材
        createProduct("减震垫", main6, "风机盘管专用", "个", 8, 15, 500, 100);
        createProduct("吊装膨胀螺栓", main6, "M10*100", "套", 3.5, 6, 2000, 500);
        createProduct("风口", main6, "方形散流器 250*250", "个", 35, 55, 800, 200);
        createProduct("风口", main6, "方形散流器 300*300", "个", 45, 68, 700, 150);
        createProduct("帆布软接", main6, "200*200 加厚", "米", 18, 28, 600, 150);
        
        log.info("===========================================");
        log.info("数据库重置完成!");
        log.info("  用户数: {}", userRepository.count());
        log.info("  分类数: {}", categoryRepository.count());
        log.info("  产品数: {}", productRepository.count());
        log.info("===========================================");
        log.info("登录账号: manager / 123456");
        log.info("===========================================");
    }
    
    private User createUser(String username, String password, String realName, UserRole role, String phone) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setRole(role);
        user.setEmail(username + "@company.com");
        user.setPhone(phone);
        user.setStatus(1);
        return userRepository.save(user);
    }
    
    private ProductCategory createCategory(String name, String description, ProductCategory parent) {
        ProductCategory category = new ProductCategory();
        category.setName(name);
        category.setDescription(description);
        category.setParent(parent);
        category.setStatus(1);
        return categoryRepository.save(category);
    }
    
    private void createProduct(String name, ProductCategory category, String spec, String unit,
                               double costPrice, double retailPrice, int stock, int minStock) {
        Product product = new Product();
        product.setName(name);
        product.setCategory(category);
        product.setSpec(spec);
        product.setUnit(unit);
        product.setCostPrice(BigDecimal.valueOf(costPrice));
        product.setRetailPrice(BigDecimal.valueOf(retailPrice));
        product.setStockQuantity(stock);
        product.setMinStock(minStock);
        product.setStatus(1);
        Product savedProduct = productRepository.save(product);

        InventoryLog log = new InventoryLog();
        log.setProduct(savedProduct);
        log.setChangeType(ChangeType.IN);
        log.setQuantity(stock);
        log.setBeforeQuantity(0);
        log.setAfterQuantity(stock);
        log.setRemark("初始化库存");
        log.setCreatedAt(LocalDateTime.now());
        logRepository.save(log);
    }
}
