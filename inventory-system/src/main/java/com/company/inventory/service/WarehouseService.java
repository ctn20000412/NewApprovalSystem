package com.company.inventory.service;

import com.company.inventory.entity.InventoryLog;
import com.company.inventory.entity.Product;
import com.company.inventory.repository.InventoryLogRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final ProductService productService;
    private final InventoryLogRepository inventoryLogRepository;

    public DashboardData getDashboardData() {
        List<Product> products = productService.findAllProducts();
        List<Product> lowStockProducts = productService.findLowStockProducts();
        List<InventoryLog> recentLogs = inventoryLogRepository.findTop100ByOrderByCreatedAtDesc()
                .stream()
                .limit(20)
                .toList();

        int totalStockQuantity = products.stream()
                .map(Product::getStockQuantity)
                .filter(quantity -> quantity != null)
                .mapToInt(Integer::intValue)
                .sum();

        BigDecimal inventoryValue = products.stream()
                .map(product -> {
                    BigDecimal costPrice = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
                    int quantity = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                    return costPrice.multiply(BigDecimal.valueOf(quantity));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardData(
                products.size(),
                totalStockQuantity,
                lowStockProducts.size(),
                inventoryValue,
                lowStockProducts,
                recentLogs
        );
    }

    public List<InventoryLog> findLogs(Long productId, LocalDate startDate, LocalDate endDate) {
        if (productId == null && startDate == null && endDate == null) {
            return inventoryLogRepository.findTop100ByOrderByCreatedAtDesc();
        }

        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime end = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        return inventoryLogRepository.searchLogs(productId, start, end)
                .stream()
                .limit(200)
                .toList();
    }

    @Getter
    @AllArgsConstructor
    public static class DashboardData {
        private final long totalProducts;
        private final int totalStockQuantity;
        private final int lowStockCount;
        private final BigDecimal inventoryValue;
        private final List<Product> lowStockProducts;
        private final List<InventoryLog> recentLogs;
    }
}
