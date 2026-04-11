package com.company.inventory.entity;

import com.company.inventory.enums.ChangeType;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_log")
public class InventoryLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 20)
    private ChangeType changeType;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "before_quantity", nullable = false)
    private Integer beforeQuantity;
    
    @Column(name = "after_quantity", nullable = false)
    private Integer afterQuantity;
    
    @ManyToOne
    @JoinColumn(name = "operator_id")
    private User operator;
    
    @Column(length = 500)
    private String remark;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
