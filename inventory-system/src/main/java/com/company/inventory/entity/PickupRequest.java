package com.company.inventory.entity;

import com.company.inventory.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "pickup_request")
public class PickupRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "request_no", unique = true, nullable = false, length = 50)
    private String requestNo;
    
    @ManyToOne
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status = RequestStatus.PENDING;
    
    @Column(name = "customer_name", length = 200)
    private String customerName;
    
    @Column(name = "project_name", length = 200)
    private String projectName;
    
    @Column(name = "total_amount", precision = 14, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "approved_amount", precision = 14, scale = 2)
    private BigDecimal approvedAmount;
    
    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "approved_comment", length = 500)
    private String approvedComment;
    
    @Column(length = 500)
    private String remark;
    
    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RequestItem> items = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
