package com.company.inventory.controller.api;

import com.company.inventory.entity.Order;
import com.company.inventory.entity.User;
import com.company.inventory.service.OrderService;
import com.company.inventory.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class ApiOrderController {

    private final OrderService orderService;
    private final UserService userService;

    public ApiOrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listOrders(
            @RequestParam(required = false) String status) {
        User currentUser = getCurrentUser();
        List<Order> orders;

        if (isManager()) {
            orders = orderService.findAllOrders();
        } else {
            orders = orderService.findBySalesId(currentUser.getId());
        }

        if (status != null && !status.isEmpty()) {
            orders = orders.stream()
                    .filter(o -> o.getStatus().name().equals(status))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(orders.stream().map(this::toOrderResponse).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        Order order = orderService.findOrderById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        User currentUser = getCurrentUser();
        if (!isManager() && !order.getSales().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Access denied");
        }

        return ResponseEntity.ok(toOrderDetailResponse(order));
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data) {
        try {
            User currentUser = getCurrentUser();
            Order order = orderService.createOrderFromRequest(
                    Long.valueOf(data.get("requestId").toString()),
                    currentUser.getId(),
                    new BigDecimal(data.get("actualAmount").toString()),
                    (String) data.get("remark")
            );
            return ResponseEntity.ok(toOrderResponse(order));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeOrder(@PathVariable Long id) {
        try {
            User currentUser = getCurrentUser();
            orderService.completeOrder(id, currentUser.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            User currentUser = getCurrentUser();
            orderService.cancelOrder(id, currentUser.getId());
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

    private Map<String, Object> toOrderResponse(Order order) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", order.getId());
        response.put("orderNo", order.getOrderNo());
        response.put("totalAmount", order.getTotalAmount());
        response.put("actualAmount", order.getActualAmount());
        response.put("remark", order.getRemark());
        response.put("status", order.getStatus().name());
        response.put("statusDescription", order.getStatus().getDescription());
        response.put("createdAt", order.getCreatedAt());
        response.put("updatedAt", order.getCreatedAt());
        response.put("completedAt", order.getCompletedAt());
        
        Map<String, Object> sales = toUserSummary(order.getSales());
        response.put("sales", sales);
        response.put("salesName", sales.get("realName"));
        response.put("salesId", sales.get("id"));
        
        if (order.getRequest() != null) {
            response.put("requestId", order.getRequest().getId());
            response.put("customerName", order.getRequest().getCustomerName());
            response.put("projectName", order.getRequest().getProjectName());
            
            Map<String, Object> requestSummary = new HashMap<>();
            requestSummary.put("id", order.getRequest().getId());
            requestSummary.put("requestNo", order.getRequest().getRequestNo());
            requestSummary.put("customerName", order.getRequest().getCustomerName());
            requestSummary.put("projectName", order.getRequest().getProjectName());
            response.put("request", requestSummary);
        }
        return response;
    }

    private Map<String, Object> toOrderDetailResponse(Order order) {
        Map<String, Object> response = toOrderResponse(order);
        if (order.getRequest() != null && order.getRequest().getItems() != null) {
            response.put("items", order.getRequest().getItems().stream().map(item -> {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("id", item.getId());
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("unitPrice", item.getUnitPrice());
                itemMap.put("subtotal", item.getSubtotal());
                if (item.getProduct() != null) {
                    Map<String, Object> productMap = new HashMap<>();
                    productMap.put("id", item.getProduct().getId());
                    productMap.put("name", item.getProduct().getName());
                    productMap.put("spec", item.getProduct().getSpec());
                    productMap.put("unit", item.getProduct().getUnit());
                    itemMap.put("product", productMap);
                    itemMap.put("productName", item.getProduct().getName());
                    itemMap.put("productId", item.getProduct().getId());
                }
                return itemMap;
            }).collect(Collectors.toList()));
        } else {
            response.put("items", List.of());
        }
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
