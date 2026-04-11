package com.company.inventory.repository;

import com.company.inventory.entity.RequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RequestItemRepository extends JpaRepository<RequestItem, Long> {
    
    List<RequestItem> findByRequestId(Long requestId);
}
