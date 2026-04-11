package com.company.inventory.config;

import com.company.inventory.entity.Product;
import com.company.inventory.entity.ProductCategory;
import com.company.inventory.entity.User;
import com.company.inventory.enums.UserRole;
import com.company.inventory.repository.ProductCategoryRepository;
import com.company.inventory.repository.ProductRepository;
import com.company.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

/**
 * 数据初始化器 - 已禁用
 * 请使用 DataResetRunner 替代
 */
@Slf4j
public class DataInitializer {
    
    private final UserRepository userRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    
    public DataInitializer(UserRepository userRepository, 
                          ProductCategoryRepository categoryRepository,
                          ProductRepository productRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    public void initialize() {
        // 初始化用户
        if (userRepository.count() == 0) {
            log.info("初始化默认用户...");
            
            User manager = new User();
            manager.setUsername("manager");
            manager.setPassword(passwordEncoder.encode("123456"));
            manager.setRealName("张经理");
            manager.setRole(UserRole.MANAGER);
            manager.setEmail("manager@company.com");
            manager.setPhone("13800138000");
            manager.setStatus(1);
            userRepository.save(manager);
            
            User sales1 = new User();
            sales1.setUsername("sales1");
            sales1.setPassword(passwordEncoder.encode("123456"));
            sales1.setRealName("李销售");
            sales1.setRole(UserRole.SALES);
            sales1.setEmail("sales1@company.com");
            sales1.setPhone("13800138001");
            sales1.setStatus(1);
            userRepository.save(sales1);
            
            User sales2 = new User();
            sales2.setUsername("sales2");
            sales2.setPassword(passwordEncoder.encode("123456"));
            sales2.setRealName("王销售");
            sales2.setRole(UserRole.SALES);
            sales2.setEmail("sales2@company.com");
            sales2.setPhone("13800138002");
            sales2.setStatus(1);
            userRepository.save(sales2);
            
            User sales3 = new User();
            sales3.setUsername("sales3");
            sales3.setPassword(passwordEncoder.encode("123456"));
            sales3.setRealName("赵销售");
            sales3.setRole(UserRole.SALES);
            sales3.setEmail("sales3@company.com");
            sales3.setPhone("13800138003");
            sales3.setStatus(1);
            userRepository.save(sales3);
            
            log.info("默认用户创建完成:");
            log.info("  经理账号: manager / 123456");
            log.info("  销售账号: sales1 / 123456");
            log.info("  销售账号: sales2 / 123456");
            log.info("  销售账号: sales3 / 123456");
        }
        
        // 初始化产品分类
        if (categoryRepository.count() == 0) {
            log.info("初始化中央空调产品分类...");
            
            // 主分类
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
            
            log.info("产品分类创建完成");
        }
        
        // 初始化产品
        if (productRepository.count() == 0) {
            log.info("初始化中央空调产品...");
            
            // 获取分类ID映射
            ProductCategory module = categoryRepository.findByName("模块机").orElse(null);
            ProductCategory heatPump = categoryRepository.findByName("风冷热泵").orElse(null);
            ProductCategory screw = categoryRepository.findByName("水冷螺杆").orElse(null);
            ProductCategory fcu = categoryRepository.findByName("风机盘管").orElse(null);
            ProductCategory ahu = categoryRepository.findByName("空气处理机组").orElse(null);
            ProductCategory freshAir = categoryRepository.findByName("新风机").orElse(null);
            ProductCategory exhaust = categoryRepository.findByName("消防排烟").orElse(null);
            ProductCategory control = categoryRepository.findByName("控制系统").orElse(null);
            ProductCategory pipe = categoryRepository.findByName("管路配件").orElse(null);
            ProductCategory install = categoryRepository.findByName("安装辅材").orElse(null);
            
            // 模块机
            if (module != null) {
                createProduct("模块化冷水机组", module, "130kW 涡旋式", "台", 68000, 88000, 8, 2);
                createProduct("模块化冷水机组", module, "260kW 涡旋式", "台", 98000, 128000, 5, 1);
                createProduct("模块化冷水机组", module, "520kW 2模块", "台", 185000, 238000, 3, 1);
                createProduct("变频模块机", module, "130kW 变频", "台", 85000, 115000, 6, 2);
            }
            
            // 风冷热泵
            if (heatPump != null) {
                createProduct("风冷热泵机组", heatPump, "80kW", "台", 95000, 128000, 6, 2);
                createProduct("风冷热泵机组", heatPump, "120kW", "台", 135000, 178000, 4, 1);
                createProduct("风冷热泵机组", heatPump, "200kW", "台", 210000, 275000, 3, 1);
                createProduct("超低温风冷热泵", heatPump, "80kW -25℃", "台", 115000, 158000, 4, 1);
            }
            
            // 水冷螺杆
            if (screw != null) {
                createProduct("水冷螺杆机组", screw, "350kW 单螺杆", "台", 168000, 218000, 4, 1);
                createProduct("水冷螺杆机组", screw, "500kW 单螺杆", "台", 225000, 295000, 3, 1);
                createProduct("水冷螺杆机组", screw, "700kW 双螺杆", "台", 320000, 420000, 2, 1);
            }
            
            // 风机盘管
            if (fcu != null) {
                createProduct("卧式暗装风机盘管", fcu, "FP-34 3400m³/h 2排管", "台", 1200, 1680, 85, 20);
                createProduct("卧式暗装风机盘管", fcu, "FP-51 5100m³/h 2排管", "台", 1450, 1980, 75, 20);
                createProduct("卧式暗装风机盘管", fcu, "FP-68 6800m³/h 2排管", "台", 1680, 2280, 60, 15);
                createProduct("卧式暗装风机盘管", fcu, "FP-85 8500m³/h 3排管", "台", 1950, 2680, 50, 10);
                createProduct("卧式暗装风机盘管", fcu, "FP-102 10200m³/h 3排管", "台", 2350, 3180, 40, 10);
                createProduct("立式明装风机盘管", fcu, "FP-34LM 3400m³/h", "台", 1450, 1980, 45, 10);
                createProduct("卡式风机盘管", fcu, "FP-68KA 四出风", "台", 2200, 2980, 35, 8);
            }
            
            // 空气处理机组
            if (ahu != null) {
                createProduct("组合式空气处理机组", ahu, "3000m³/h", "台", 8500, 11800, 12, 3);
                createProduct("组合式空气处理机组", ahu, "5000m³/h", "台", 12500, 16800, 10, 3);
                createProduct("组合式空气处理机组", ahu, "8000m³/h", "台", 18500, 24800, 8, 2);
                createProduct("组合式空气处理机组", ahu, "12000m³/h", "台", 28000, 37500, 5, 2);
            }
            
            // 新风机
            if (freshAir != null) {
                createProduct("新风换气机组", freshAir, "500m³/h 热回收", "台", 6800, 9200, 15, 4);
                createProduct("新风换气机组", freshAir, "1000m³/h 热回收", "台", 9800, 13500, 12, 3);
                createProduct("新风换气机组", freshAir, "2000m³/h 热回收", "台", 15800, 21800, 8, 2);
            }
            
            // 消防排烟
            if (exhaust != null) {
                createProduct("消防排烟风机", exhaust, "HTF-I-5 5000m³/h", "台", 2800, 3800, 25, 6);
                createProduct("消防排烟风机", exhaust, "HTF-I-8 8000m³/h", "台", 4200, 5600, 20, 5);
                createProduct("消防排烟风机", exhaust, "HTF-I-12 12000m³/h", "台", 5800, 7800, 15, 4);
            }
            
            // 控制系统
            if (control != null) {
                createProduct("中央空调控制面板", control, "LCD液晶 联网型", "个", 380, 580, 120, 30);
                createProduct("中央空调控制面板", control, "触摸屏 彩色", "个", 680, 980, 80, 20);
                createProduct("网关模块", control, "BACnet/Modbus", "个", 850, 1280, 40, 10);
            }
            
            // 管路配件
            if (pipe != null) {
                createProduct("分歧器 二分歧", pipe, "冷媒分歧器", "个", 120, 180, 200, 50);
                createProduct("分歧器 四分歧", pipe, "冷媒分歧器", "个", 180, 280, 150, 40);
                createProduct("分歧器 七分歧", pipe, "冷媒分歧器", "个", 320, 480, 80, 20);
                createProduct("保温铜管 Φ6.35mm", pipe, "0.8mm厚", "米", 12, 18, 5000, 1000);
                createProduct("保温铜管 Φ9.52mm", pipe, "0.8mm厚", "米", 15, 22, 4500, 1000);
                createProduct("保温铜管 Φ12.7mm", pipe, "1.0mm厚", "米", 22, 32, 4000, 800);
                createProduct("保温铜管 Φ15.88mm", pipe, "1.0mm厚", "米", 28, 42, 3500, 700);
                createProduct("保温橡塑", pipe, "Φ6-25mm", "米", 3.5, 5.5, 8000, 2000);
            }
            
            // 安装辅材
            if (install != null) {
                createProduct("减震垫", install, "风机盘管专用", "个", 8, 15, 500, 100);
                createProduct("吊装膨胀螺栓", install, "M10*100", "套", 3.5, 6, 2000, 500);
                createProduct("风口", install, "方形散流器 250*250", "个", 35, 55, 800, 200);
                createProduct("风口", install, "方形散流器 300*300", "个", 45, 68, 700, 150);
                createProduct("帆布软接", install, "200*200 加厚", "米", 18, 28, 600, 150);
            }
            
            log.info("中央空调产品创建完成，共 {} 个产品", productRepository.count());
        }
        
        log.info("数据初始化完成!");
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
        productRepository.save(product);
    }
}
