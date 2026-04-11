package com.company.inventory.service;

import com.company.inventory.entity.Product;
import com.company.inventory.entity.ProductCategory;
import com.company.inventory.repository.ProductRepository;
import com.company.inventory.repository.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;
    
    // ==================== 分类管理 ====================
    
    public List<ProductCategory> findAllCategories() {
        return categoryRepository.findAll();
    }
    
    public List<ProductCategory> findRootCategories() {
        return categoryRepository.findByParentIsNull();
    }
    
    public Optional<ProductCategory> findCategoryById(Long id) {
        return categoryRepository.findById(id);
    }
    
    @Transactional
    public ProductCategory createCategory(String name, String description, Long parentId) {
        ProductCategory category = new ProductCategory();
        category.setName(name);
        category.setDescription(description);
        category.setStatus(1);
        
        if (parentId != null) {
            ProductCategory parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("父分类不存在"));
            category.setParent(parent);
        }
        
        return categoryRepository.save(category);
    }
    
    @Transactional
    public ProductCategory updateCategory(Long id, String name, String description) {
        ProductCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分类不存在"));
        
        category.setName(name);
        category.setDescription(description);
        
        return categoryRepository.save(category);
    }
    
    // ==================== 产品管理 ====================
    
    public List<Product> findAllProducts() {
        return productRepository.findByStatus(1);
    }
    
    public Optional<Product> findProductById(Long id) {
        return productRepository.findById(id);
    }
    
    public List<Product> findByCategoryId(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }
    
    public List<Product> searchProducts(String keyword) {
        return productRepository.searchByKeyword(keyword);
    }
    
    public List<Product> findLowStockProducts() {
        return productRepository.findLowStockProducts();
    }
    
    @Transactional
    public Product createProduct(String name, Long categoryId, String spec, String unit,
                                  BigDecimal costPrice, BigDecimal retailPrice, 
                                  Integer stockQuantity, Integer minStock) {
        Product product = new Product();
        product.setName(name);
        product.setSpec(spec);
        product.setUnit(unit);
        product.setCostPrice(costPrice);
        product.setRetailPrice(retailPrice);
        product.setStockQuantity(stockQuantity);
        product.setMinStock(minStock);
        product.setStatus(1);
        
        if (categoryId != null) {
            ProductCategory category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("分类不存在"));
            product.setCategory(category);
        }
        
        return productRepository.save(product);
    }
    
    @Transactional
    public Product updateProduct(Long id, String name, Long categoryId, String spec, 
                                  String unit, BigDecimal costPrice, BigDecimal retailPrice,
                                  Integer minStock) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("产品不存在"));
        
        product.setName(name);
        product.setSpec(spec);
        product.setUnit(unit);
        product.setCostPrice(costPrice);
        product.setRetailPrice(retailPrice);
        product.setMinStock(minStock);
        
        if (categoryId != null) {
            ProductCategory category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("分类不存在"));
            product.setCategory(category);
        }
        
        return productRepository.save(product);
    }
    
    @Transactional
    public void adjustStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("产品不存在"));
        
        int newQuantity = product.getStockQuantity() + quantity;
        if (newQuantity < 0) {
            throw new RuntimeException("库存不足");
        }
        
        product.setStockQuantity(newQuantity);
        productRepository.save(product);
    }
    
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("产品不存在"));
        product.setStatus(0); // 软删除
        productRepository.save(product);
    }
}
