package com.company.inventory.service;

import com.company.inventory.entity.*;
import com.company.inventory.enums.RequestStatus;
import com.company.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PickupRequestService {
    
    private final PickupRequestRepository requestRepository;
    private final RequestItemRepository itemRepository;
    private final ProductService productService;
    private final UserService userService;
    private final NotificationService notificationService;
    
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    
    public List<PickupRequest> findAllRequests() {
        return requestRepository.findAll();
    }
    
    public Optional<PickupRequest> findRequestById(Long id) {
        return requestRepository.findById(id);
    }
    
    public List<PickupRequest> findByApplicant(Long applicantId) {
        return requestRepository.findByApplicantId(applicantId);
    }
    
    public List<PickupRequest> findPendingRequests() {
        return requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.PENDING);
    }
    
    public List<PickupRequest> findByApplicantAndStatus(Long applicantId, RequestStatus status) {
        return requestRepository.findByApplicantIdAndStatus(applicantId, status);
    }
    
    @Transactional
    public PickupRequest createRequest(Long applicantId, String customerName, 
                                        String projectName, String remark,
                                        List<RequestItemDTO> items) {
        User applicant = userService.findById(applicantId)
                .orElseThrow(() -> new RuntimeException("申请人不存在"));
        
        PickupRequest request = new PickupRequest();
        request.setRequestNo(generateRequestNo());
        request.setApplicant(applicant);
        request.setCustomerName(customerName);
        request.setProjectName(projectName);
        request.setRemark(remark);
        request.setStatus(RequestStatus.PENDING);
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (RequestItemDTO itemDTO : items) {
            Product product = productService.findProductById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("产品不存在: " + itemDTO.getProductId()));
            
            RequestItem item = new RequestItem();
            item.setRequest(request);
            item.setProduct(product);
            item.setQuantity(itemDTO.getQuantity());
            item.setUnitPrice(itemDTO.getUnitPrice());
            item.setSubtotal(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            
            request.getItems().add(item);
            totalAmount = totalAmount.add(item.getSubtotal());
        }
        
        request.setTotalAmount(totalAmount);
        
        PickupRequest savedRequest = requestRepository.save(request);
        notificationService.notifyRequestCreated(savedRequest);
        return savedRequest;
    }
    
    @Transactional
    public PickupRequest updateRequest(Long requestId, String customerName, 
                                        String projectName, String remark,
                                        List<RequestItemDTO> items) {
        PickupRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("只能修改待审核状态的请求");
        }
        
        request.setCustomerName(customerName);
        request.setProjectName(projectName);
        request.setRemark(remark);
        request.getItems().clear();
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (RequestItemDTO itemDTO : items) {
            Product product = productService.findProductById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("产品不存在: " + itemDTO.getProductId()));
            
            RequestItem item = new RequestItem();
            item.setRequest(request);
            item.setProduct(product);
            item.setQuantity(itemDTO.getQuantity());
            item.setUnitPrice(itemDTO.getUnitPrice());
            item.setSubtotal(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            
            request.getItems().add(item);
            totalAmount = totalAmount.add(item.getSubtotal());
        }
        
        request.setTotalAmount(totalAmount);
        
        PickupRequest savedRequest = requestRepository.save(request);
        notificationService.notifyRequestApproved(savedRequest);
        return savedRequest;
    }
    
    @Transactional
    public PickupRequest approveRequest(Long requestId, Long approverId) {
        PickupRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("只能审核待处理状态的请求");
        }
        
        User approver = userService.findById(approverId)
                .orElseThrow(() -> new RuntimeException("审批人不存在"));
        
        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedAmount(request.getTotalAmount());
        
        // 更新每个item的审批数量和价格
        for (RequestItem item : request.getItems()) {
            item.setApprovedQuantity(item.getQuantity());
            item.setApprovedPrice(item.getUnitPrice());
        }
        
        PickupRequest savedRequest = requestRepository.save(request);
        notificationService.notifyRequestRejected(savedRequest);
        return savedRequest;
    }
    
    @Transactional
    public PickupRequest rejectRequest(Long requestId, Long approverId, String comment) {
        PickupRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("只能审核待处理状态的请求");
        }
        
        User approver = userService.findById(approverId)
                .orElseThrow(() -> new RuntimeException("审批人不存在"));
        
        request.setStatus(RequestStatus.REJECTED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedComment(comment);
        
        PickupRequest savedRequest = requestRepository.save(request);
        notificationService.notifyRequestAdjusted(savedRequest);
        return savedRequest;
    }
    
    @Transactional
    public PickupRequest adjustRequest(Long requestId, Long approverId, String comment,
                                       List<RequestItemDTO> adjustedItems) {
        PickupRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("只能调整待处理状态的请求");
        }
        
        User approver = userService.findById(approverId)
                .orElseThrow(() -> new RuntimeException("审批人不存在"));
        
        request.setStatus(RequestStatus.ADJUSTED);
        request.setApprovedBy(approver);
        request.setApprovedAt(LocalDateTime.now());
        request.setApprovedComment(comment);
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        request.getItems().clear();
        
        for (RequestItemDTO itemDTO : adjustedItems) {
            Product product = productService.findProductById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("产品不存在: " + itemDTO.getProductId()));
            
            RequestItem item = new RequestItem();
            item.setRequest(request);
            item.setProduct(product);
            item.setQuantity(item.getQuantity());
            item.setApprovedQuantity(itemDTO.getQuantity());
            item.setUnitPrice(itemDTO.getUnitPrice());
            item.setApprovedPrice(itemDTO.getUnitPrice());
            item.setSubtotal(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())));
            
            request.getItems().add(item);
            totalAmount = totalAmount.add(item.getSubtotal());
        }
        
        request.setApprovedAmount(totalAmount);
        
        return requestRepository.save(request);
    }
    
    @Transactional
    public void cancelRequest(Long requestId) {
        PickupRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("只能取消待审核状态的请求");
        }
        
        request.setStatus(RequestStatus.CANCELLED);
        requestRepository.save(request);
    }
    
    private String generateRequestNo() {
        return "REQ" + LocalDateTime.now().format(DATE_FORMAT);
    }
    
    // DTO内部类
    @lombok.Data
    public static class RequestItemDTO {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
