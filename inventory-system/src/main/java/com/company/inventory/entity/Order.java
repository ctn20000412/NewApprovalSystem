package com.company.inventory.entity;

import com.company.inventory.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_no", unique = true, nullable = false, length = 50)
    private String orderNo;
    
    @ManyToOne
    @JoinColumn(name = "request_id")
    private PickupRequest request;
    
    @ManyToOne
    @JoinColumn(name = "sales_id", nullable = false)
    private User sales;
    
    @Column(name = "customer_name", length = 200)
    private String customerName;
    
    @Column(name = "project_name", length = 200)
    private String projectName;
    
    @Column(name = "total_amount", precision = 14, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "actual_amount", precision = 14, scale = 2)
    private BigDecimal actualAmount;
    
    @Column(name = "order_date")
    private LocalDate orderDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PENDING;
    
    @Column(length = 500)
    private String remark;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (orderDate == null) {
            orderDate = LocalDate.now();
        }
    }
}
