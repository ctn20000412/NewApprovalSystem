package com.company.inventory.repository;

import com.company.inventory.entity.InventoryLog;
import com.company.inventory.enums.ChangeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {
    
    List<InventoryLog> findByProductId(Long productId);
    
    List<InventoryLog> findByOrderId(Long orderId);
    
    List<InventoryLog> findByChangeType(ChangeType changeType);

    List<InventoryLog> findTop100ByOrderByCreatedAtDesc();
    
    @Query("SELECT l FROM InventoryLog l WHERE l.product.id = :productId AND l.createdAt BETWEEN :start AND :end ORDER BY l.createdAt DESC")
    List<InventoryLog> findByProductIdAndDateRange(@Param("productId") Long productId, 
                                                   @Param("start") LocalDateTime start, 
                                                   @Param("end") LocalDateTime end);

    @Query("""
        SELECT l
        FROM InventoryLog l
        WHERE (:productId IS NULL OR l.product.id = :productId)
          AND (:start IS NULL OR l.createdAt >= :start)
          AND (:end IS NULL OR l.createdAt <= :end)
        ORDER BY l.createdAt DESC
        """)
    List<InventoryLog> searchLogs(@Param("productId") Long productId,
                                  @Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);
}
