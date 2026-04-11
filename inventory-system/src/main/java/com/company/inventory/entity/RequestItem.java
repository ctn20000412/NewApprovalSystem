package com.company.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "request_item")
public class RequestItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private PickupRequest request;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "unit_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;
    
    @Column(name = "approved_quantity")
    private Integer approvedQuantity;
    
    @Column(name = "approved_price", precision = 12, scale = 2)
    private BigDecimal approvedPrice;
    
    @Column(precision = 14, scale = 2)
    private BigDecimal subtotal;
    
    @Transient
    public BigDecimal calculateSubtotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
