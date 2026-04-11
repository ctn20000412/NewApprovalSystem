package com.company.inventory.controller.api;

import com.company.inventory.entity.InventoryLog;
import com.company.inventory.entity.Product;
import com.company.inventory.entity.ProductCategory;
import com.company.inventory.entity.User;
import com.company.inventory.enums.ChangeType;
import com.company.inventory.service.ProductService;
import com.company.inventory.service.WarehouseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ApiProductController {

    private final ProductService productService;
    private final WarehouseService warehouseService;

    public ApiProductController(ProductService productService, WarehouseService warehouseService) {
        this.productService = productService;
        this.warehouseService = warehouseService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId) {
        List<Product> products;
        if (keyword != null && !keyword.isEmpty()) {
            products = productService.searchProducts(keyword);
        } else if (categoryId != null) {
            products = productService.findByCategoryId(categoryId);
        } else {
            products = productService.findAllProducts();
        }
        return ResponseEntity.ok(products.stream().map(this::toProductResponse).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        Product product = productService.findProductById(id).orElse(null);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toProductResponse(product));
    }

    @GetMapping("/{id}/inventory-logs")
    public ResponseEntity<?> getProductInventoryLogs(@PathVariable Long id) {
        Product product = productService.findProductById(id).orElse(null);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        List<Map<String, Object>> logs = warehouseService.findLogs(id, null, null).stream()
                .map(this::toLogResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> listCategories() {
        List<ProductCategory> categories = productService.findAllCategories();
        return ResponseEntity.ok(categories.stream().map(this::toCategoryResponse).collect(Collectors.toList()));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Map<String, Object>>> getLowStockProducts() {
        List<Product> products = productService.findLowStockProducts();
        return ResponseEntity.ok(products.stream().map(this::toProductResponse).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Map<String, Object> data) {
        try {
            Product product = productService.createProduct(
                (String) data.get("name"),
                Long.valueOf(data.get("categoryId").toString()),
                (String) data.get("spec"),
                (String) data.get("unit"),
                new BigDecimal(data.get("costPrice").toString()),
                new BigDecimal(data.get("retailPrice").toString()),
                Integer.valueOf(data.get("stockQuantity").toString()),
                Integer.valueOf(data.get("minStock").toString())
            );
            return ResponseEntity.ok(toProductResponse(product));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Product product = productService.updateProduct(
                id,
                (String) data.get("name"),
                Long.valueOf(data.get("categoryId").toString()),
                (String) data.get("spec"),
                (String) data.get("unit"),
                new BigDecimal(data.get("costPrice").toString()),
                new BigDecimal(data.get("retailPrice").toString()),
                Integer.valueOf(data.get("minStock").toString())
            );
            return ResponseEntity.ok(toProductResponse(product));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
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
