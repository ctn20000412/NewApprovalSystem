package com.company.inventory.repository;

import com.company.inventory.entity.Order;
import com.company.inventory.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    Optional<Order> findByOrderNo(String orderNo);
    
    List<Order> findBySalesId(Long salesId);
    
    List<Order> findByStatus(OrderStatus status);
    
    @Query("SELECT o FROM Order o WHERE o.sales.id = :salesId AND o.orderDate BETWEEN :start AND :end")
    List<Order> findBySalesIdAndDateRange(@Param("salesId") Long salesId, 
                                          @Param("start") LocalDate start, 
                                          @Param("end") LocalDate end);
    
    @Query("SELECT o FROM Order o WHERE o.orderDate BETWEEN :start AND :end")
    List<Order> findByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.sales.id = :salesId AND o.orderDate BETWEEN :start AND :end")
    Long countBySalesIdAndDateRange(@Param("salesId") Long salesId, 
                                    @Param("start") LocalDate start, 
                                    @Param("end") LocalDate end);
    
    @Query("SELECT COALESCE(SUM(o.actualAmount), 0) FROM Order o WHERE o.sales.id = :salesId AND o.orderDate BETWEEN :start AND :end")
    BigDecimal sumAmountBySalesIdAndDateRange(@Param("salesId") Long salesId, 
                                              @Param("start") LocalDate start, 
                                              @Param("end") LocalDate end);
    
    @Query("SELECT COALESCE(SUM(o.actualAmount), 0) FROM Order o WHERE o.orderDate BETWEEN :start AND :end")
    BigDecimal sumAmountByDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
