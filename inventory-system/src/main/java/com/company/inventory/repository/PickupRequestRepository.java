package com.company.inventory.repository;

import com.company.inventory.entity.PickupRequest;
import com.company.inventory.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRequestRepository extends JpaRepository<PickupRequest, Long> {
    
    Optional<PickupRequest> findByRequestNo(String requestNo);
    
    List<PickupRequest> findByApplicantId(Long applicantId);
    
    List<PickupRequest> findByStatus(RequestStatus status);
    
    List<PickupRequest> findByApplicantIdAndStatus(Long applicantId, RequestStatus status);
    
    @Query("SELECT r FROM PickupRequest r WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<PickupRequest> findByStatusOrderByCreatedAtDesc(@Param("status") RequestStatus status);
    
    @Query("SELECT r FROM PickupRequest r WHERE r.createdAt BETWEEN :start AND :end")
    List<PickupRequest> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(r) FROM PickupRequest r WHERE r.applicant.id = :salesId AND r.status = :status")
    Long countBySalesIdAndStatus(@Param("salesId") Long salesId, @Param("status") RequestStatus status);
}
