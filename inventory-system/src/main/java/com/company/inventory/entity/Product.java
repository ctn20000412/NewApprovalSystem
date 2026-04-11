package com.company.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "product")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @ManyToOne
    @JoinColumn(name = "category_id")
    private ProductCategory category;
    
    @Column(length = 200)
    private String spec;
    
    @Column(length = 20)
    private String unit;
    
    @Column(name = "cost_price", precision = 12, scale = 2)
    private BigDecimal costPrice;
    
    @Column(name = "retail_price", precision = 12, scale = 2)
    private BigDecimal retailPrice;
    
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;
    
    @Column(name = "min_stock")
    private Integer minStock = 0;
    
    @Column(nullable = false)
    private Integer status = 1;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
