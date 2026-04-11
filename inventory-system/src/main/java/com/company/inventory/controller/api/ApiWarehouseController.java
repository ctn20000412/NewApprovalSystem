package com.company.inventory.controller.api;

import com.company.inventory.entity.InventoryLog;
import com.company.inventory.entity.Product;
import com.company.inventory.entity.ProductCategory;
import com.company.inventory.entity.User;
import com.company.inventory.enums.ChangeType;
import com.company.inventory.service.WarehouseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/warehouse")
public class ApiWarehouseController {

    private final WarehouseService warehouseService;

    public ApiWarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        WarehouseService.DashboardData data = warehouseService.getDashboardData();

        Map<String, Object> response = new HashMap<>();
        response.put("totalProducts", data.getTotalProducts());
        response.put("totalStockQuantity", data.getTotalStockQuantity());
        response.put("lowStockCount", data.getLowStockCount());
        response.put("inventoryValue", data.getInventoryValue());
        response.put("lowStockProducts", data.getLowStockProducts().stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList()));
        response.put("recentLogs", data.getRecentLogs().stream()
                .map(this::toLogResponse)
                .collect(Collectors.toList()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getLogs(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            LocalDate start = parseDate(startDate);
            LocalDate end = parseDate(endDate);

            List<Map<String, Object>> logs = warehouseService.findLogs(productId, start, end).stream()
                    .map(this::toLogResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(logs);
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Error: invalid date format, expected yyyy-MM-dd");
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDate.parse(value);
    }

    private Map<String, Object> toProductResponse(Product product) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", product.getId());
        response.put("name", product.getName());
        response.put("model", product.getSpec());
        response.put("spec", product.getSpec());
        response.put("unit", product.getUnit());
        response.put("price", product.getRetailPrice());
        response.put("costPrice", product.getCostPrice());
        response.put("retailPrice", product.getRetailPrice());
        response.put("stockQuantity", product.getStockQuantity());
        response.put("minStock", product.getMinStock());
        response.put("status", product.getStatus());
        response.put("active", product.getStatus() == 1);
        if (product.getCategory() != null) {
            response.put("categoryId", product.getCategory().getId());
            response.put("categoryName", product.getCategory().getName());
            response.put("category", toCategoryResponse(product.getCategory()));
        }
        return response;
    }

    private Map<String, Object> toCategoryResponse(ProductCategory category) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", category.getId());
        response.put("name", category.getName());
        response.put("description", category.getDescription());
        response.put("status", category.getStatus());
        if (category.getParent() != null) {
            Map<String, Object> parent = new HashMap<>();
            parent.put("id", category.getParent().getId());
            parent.put("name", category.getParent().getName());
            response.put("parent", parent);
        }
        return response;
    }

    private Map<String, Object> toLogResponse(InventoryLog log) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", log.getId());
        response.put("productId", log.getProduct().getId());
        response.put("productName", log.getProduct().getName());
        response.put("productSpec", log.getProduct().getSpec());
        response.put("productUnit", log.getProduct().getUnit());
        response.put("changeType", log.getChangeType().name());
        response.put("changeTypeDescription", log.getChangeType().getDescription());
        response.put("quantity", toSignedQuantity(log));
        response.put("rawQuantity", log.getQuantity());
        response.put("beforeQuantity", log.getBeforeQuantity());
        response.put("afterQuantity", log.getAfterQuantity());
        response.put("balance", log.getAfterQuantity());
        response.put("remark", log.getRemark());
        response.put("createdAt", log.getCreatedAt());

        User operator = log.getOperator();
        if (operator != null) {
            response.put("operatorName", operator.getRealName());
        }

        if (log.getOrder() != null) {
            response.put("orderId", log.getOrder().getId());
            response.put("orderNo", log.getOrder().getOrderNo());
        }

        return response;
    }

    private int toSignedQuantity(InventoryLog log) {
        ChangeType changeType = log.getChangeType();
        if (changeType == ChangeType.OUT) {
            return -Math.abs(log.getQuantity());
        }
        if (changeType == ChangeType.IN) {
            return Math.abs(log.getQuantity());
        }
        return log.getAfterQuantity() - log.getBeforeQuantity();
    }
}
