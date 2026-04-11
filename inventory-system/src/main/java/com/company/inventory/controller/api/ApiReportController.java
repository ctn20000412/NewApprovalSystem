package com.company.inventory.controller.api;

import com.company.inventory.entity.User;
import com.company.inventory.enums.UserRole;
import com.company.inventory.service.ReportService;
import com.company.inventory.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ApiReportController {

    private final ReportService reportService;
    private final UserService userService;

    public ApiReportController(ReportService reportService, UserService userService) {
        this.reportService = reportService;
        this.userService = userService;
    }

    @GetMapping("/company")
    public ResponseEntity<?> getCompanyOverview(@RequestParam(required = false) String month) {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            YearMonth yearMonth = parseMonth(month);
            return ResponseEntity.ok(reportService.getCompanyOverview(yearMonth.getYear(), yearMonth.getMonthValue()));
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Error: invalid month format, expected yyyy-MM");
        }
    }

    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyReport(@RequestParam int year, @RequestParam int month) {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        return ResponseEntity.ok(reportService.getMonthlyReport(year, month));
    }

    @GetMapping("/sales")
    public ResponseEntity<?> getSalesReport(@RequestParam(required = false) Long userId,
                                            @RequestParam(required = false) String month) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        try {
            YearMonth yearMonth = parseMonth(month);
            Long targetUserId = resolveSalesUserId(currentUser, userId);
            ReportService.SalesPerformance performance =
                    reportService.getSalesPerformance(targetUserId, yearMonth.getYear(), yearMonth.getMonthValue());

            Map<String, Object> response = new HashMap<>();
            response.put("year", yearMonth.getYear());
            response.put("month", yearMonth.getMonthValue());
            response.put("userId", targetUserId);
            response.put("salesName", performance.getSalesName());
            response.put("orderCount", performance.getOrderCount());
            response.put("totalAmount", performance.getTotalAmount());
            response.put("customerCount", performance.getCustomerCount());
            response.put("avgPrice", performance.getAvgPrice());
            return ResponseEntity.ok(response);
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Error: invalid month format, expected yyyy-MM");
        }
    }

    @GetMapping("/sales-users")
    public ResponseEntity<?> listSalesUsers() {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        List<Map<String, Object>> salesUsers = userService.findSalesUsers().stream()
                .filter(user -> user.getStatus() != null && user.getStatus() == 1)
                .map(this::toUserSummary)
                .collect(Collectors.toList());
        return ResponseEntity.ok(salesUsers);
    }

    private ResponseEntity<?> requireManager() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        if (currentUser.getRole() != UserRole.MANAGER) {
            return ResponseEntity.status(403).body("Access denied");
        }
        return null;
    }

    private Long resolveSalesUserId(User currentUser, Long requestedUserId) {
        if (currentUser.getRole() == UserRole.MANAGER) {
            return requestedUserId != null ? requestedUserId : currentUser.getId();
        }
        return currentUser.getId();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userService.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now();
        }
        return YearMonth.parse(month);
    }

    private Map<String, Object> toUserSummary(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("realName", user.getRealName());
        response.put("role", user.getRole().name());
        response.put("roleDescription", user.getRole().getDescription());
        response.put("status", user.getStatus());
        return response;
    }
}
