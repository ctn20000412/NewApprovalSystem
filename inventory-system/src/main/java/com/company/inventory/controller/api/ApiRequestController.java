package com.company.inventory.controller.api;

import com.company.inventory.entity.PickupRequest;
import com.company.inventory.entity.RequestItem;
import com.company.inventory.entity.User;
import com.company.inventory.enums.RequestStatus;
import com.company.inventory.service.PickupRequestService;
import com.company.inventory.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
public class ApiRequestController {

    private final PickupRequestService requestService;
    private final UserService userService;

    public ApiRequestController(PickupRequestService requestService, UserService userService) {
        this.requestService = requestService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listRequests(
            @RequestParam(required = false) String status) {
        User currentUser = getCurrentUser();
        List<PickupRequest> requests;
        
        if (isManager()) {
            if (status != null && !status.isEmpty()) {
                requests = requestService.findByApplicantAndStatus(null, RequestStatus.valueOf(status));
            } else {
                requests = requestService.findAllRequests();
            }
        } else {
            requests = requestService.findByApplicant(currentUser.getId());
            if (status != null && !status.isEmpty()) {
                requests = requests.stream()
                    .filter(r -> r.getStatus().name().equals(status))
                    .collect(Collectors.toList());
            }
        }
        
        return ResponseEntity.ok(requests.stream().map(this::toRequestResponse).collect(Collectors.toList()));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> pendingRequests() {
        List<PickupRequest> requests = requestService.findPendingRequests();
        return ResponseEntity.ok(requests.stream().map(this::toRequestResponse).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRequest(@PathVariable Long id) {
        PickupRequest request = requestService.findRequestById(id).orElse(null);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        
        User currentUser = getCurrentUser();
        if (!isManager() && !request.getApplicant().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        return ResponseEntity.ok(toRequestDetailResponse(request));
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> data) {
        try {
            User currentUser = getCurrentUser();
            
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) data.get("items");
            List<PickupRequestService.RequestItemDTO> items = new ArrayList<>();
            
            for (Map<String, Object> itemData : itemsData) {
                PickupRequestService.RequestItemDTO item = new PickupRequestService.RequestItemDTO();
                item.setProductId(Long.valueOf(itemData.get("productId").toString()));
                item.setQuantity(Integer.valueOf(itemData.get("quantity").toString()));
                item.setUnitPrice(new BigDecimal(itemData.get("unitPrice").toString()));
                items.add(item);
            }
            
            PickupRequest request = requestService.createRequest(
                currentUser.getId(),
                (String) data.get("customerName"),
                (String) data.get("projectName"),
                (String) data.get("remark"),
                items
            );
            
            return ResponseEntity.ok(toRequestResponse(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequest(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) data.get("items");
            List<PickupRequestService.RequestItemDTO> items = new ArrayList<>();
            
            for (Map<String, Object> itemData : itemsData) {
                PickupRequestService.RequestItemDTO item = new PickupRequestService.RequestItemDTO();
                item.setProductId(Long.valueOf(itemData.get("productId").toString()));
                item.setQuantity(Integer.valueOf(itemData.get("quantity").toString()));
                item.setUnitPrice(new BigDecimal(itemData.get("unitPrice").toString()));
                items.add(item);
            }
            
            PickupRequest request = requestService.updateRequest(
                id,
                (String) data.get("customerName"),
                (String) data.get("projectName"),
                (String) data.get("remark"),
                items
            );
            
            return ResponseEntity.ok(toRequestResponse(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelRequest(@PathVariable Long id) {
        try {
            requestService.cancelRequest(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        if (!isManager()) {
            return ResponseEntity.status(403).body("Access denied");
        }
        try {
            User currentUser = getCurrentUser();
            requestService.approveRequest(id, currentUser.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id, @RequestBody Map<String, String> data) {
        if (!isManager()) {
            return ResponseEntity.status(403).body("Access denied");
        }
        try {
            User currentUser = getCurrentUser();
            requestService.rejectRequest(id, currentUser.getId(), data.get("comment"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userService.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    private boolean isManager() {
        User user = getCurrentUser();
        return user != null && "MANAGER".equals(user.getRole().name());
    }

    private Map<String, Object> toRequestResponse(PickupRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", request.getId());
        response.put("requestNo", request.getRequestNo());
        response.put("customerName", request.getCustomerName());
        response.put("projectName", request.getProjectName());
        response.put("remark", request.getRemark());
        response.put("totalAmount", request.getTotalAmount());
        response.put("estimatedAmount", request.getTotalAmount());
        response.put("status", request.getStatus().name());
        response.put("statusDescription", request.getStatus().getDescription());
        response.put("createdAt", request.getCreatedAt());
        
        Map<String, Object> applicant = toUserSummary(request.getApplicant());
        response.put("applicant", applicant);
        response.put("salesName", applicant.get("realName"));
        response.put("salesId", applicant.get("id"));
        
        if (request.getApprovedBy() != null) {
            Map<String, Object> approver = toUserSummary(request.getApprovedBy());
            response.put("approvedBy", approver);
            response.put("approvedAt", request.getApprovedAt());
            response.put("approvedComment", request.getApprovedComment());
        }
        return response;
    }

    private Map<String, Object> toRequestDetailResponse(PickupRequest request) {
        Map<String, Object> response = toRequestResponse(request);
        response.put("items", request.getItems().stream().map(this::toItemResponse).collect(Collectors.toList()));
        return response;
    }

    private Map<String, Object> toItemResponse(RequestItem item) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", item.getId());
        response.put("quantity", item.getQuantity());
        response.put("unitPrice", item.getUnitPrice());
        response.put("subtotal", item.getSubtotal());
        response.put("product", toProductSummary(item.getProduct()));
        response.put("productId", item.getProduct() != null ? item.getProduct().getId() : null);
        response.put("productName", item.getProduct() != null ? item.getProduct().getName() : null);
        return response;
    }

    private Map<String, Object> toProductSummary(com.company.inventory.entity.Product product) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", product.getId());
        response.put("name", product.getName());
        response.put("spec", product.getSpec());
        response.put("unit", product.getUnit());
        response.put("stockQuantity", product.getStockQuantity());
        return response;
    }

    private Map<String, Object> toUserSummary(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("realName", user.getRealName());
        response.put("role", user.getRole().name());
        response.put("roleDescription", user.getRole().getDescription());
        return response;
    }
}
