package com.company.inventory.repository;

import com.company.inventory.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByStatus(Integer status);
    
    List<Product> findByCategoryId(Long categoryId);
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.minStock")
    List<Product> findLowStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:keyword% OR p.spec LIKE %:keyword%")
    List<Product> searchByKeyword(@Param("keyword") String keyword);
}
