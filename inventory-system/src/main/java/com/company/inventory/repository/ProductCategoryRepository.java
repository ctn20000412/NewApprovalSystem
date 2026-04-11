package com.company.inventory.repository;

import com.company.inventory.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    
    List<ProductCategory> findByParentIsNull();
    
    List<ProductCategory> findByStatus(Integer status);
    
    List<ProductCategory> findByParentId(Long parentId);
    
    Optional<ProductCategory> findByName(String name);
}
