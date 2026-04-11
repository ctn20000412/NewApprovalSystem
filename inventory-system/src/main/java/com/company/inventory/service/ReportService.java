package com.company.inventory.service;

import com.company.inventory.entity.Order;
import com.company.inventory.entity.PickupRequest;
import com.company.inventory.entity.User;
import com.company.inventory.enums.OrderStatus;
import com.company.inventory.enums.RequestStatus;
import com.company.inventory.enums.UserRole;
import com.company.inventory.repository.OrderRepository;
import com.company.inventory.repository.PickupRequestRepository;
import com.company.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {
    
    private final OrderRepository orderRepository;
    private final PickupRequestRepository requestRepository;
    private final UserRepository userRepository;
    
    // ==================== 月度统计 ====================
    
    public MonthlyReport getMonthlyReport(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        
        List<Order> orders = orderRepository.findByDateRange(start, end);
        List<Order> completedOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .toList();
        
        BigDecimal totalAmount = completedOrders.stream()
                .map(Order::getActualAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        MonthlyReport report = new MonthlyReport();
        report.setYear(year);
        report.setMonth(month);
        report.setOrderCount(completedOrders.size());
        report.setTotalAmount(totalAmount);
        
        // 销售排行榜
        Map<Long, SalesPerformance> salesMap = new HashMap<>();
        for (Order order : completedOrders) {
            Long salesId = order.getSales().getId();
            SalesPerformance perf = salesMap.computeIfAbsent(salesId, 
                    id -> new SalesPerformance(order.getSales().getRealName(), 0, BigDecimal.ZERO));
            perf.setOrderCount(perf.getOrderCount() + 1);
            perf.setTotalAmount(perf.getTotalAmount().add(order.getActualAmount()));
        }
        report.setSalesRanking(new ArrayList<>(salesMap.values()));
        report.getSalesRanking().sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));
        
        return report;
    }
    
    // ==================== 销售业绩统计 ====================
    
    public SalesPerformance getSalesPerformance(Long salesId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        
        List<Order> orders = orderRepository.findBySalesIdAndDateRange(salesId, start, end);
        List<Order> completedOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .toList();
        
        User sales = userRepository.findById(salesId).orElse(null);
        String salesName = sales != null ? sales.getRealName() : "未知";
        
        long orderCount = completedOrders.size();
        BigDecimal totalAmount = completedOrders.stream()
                .map(Order::getActualAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // 统计客户数量
        long customerCount = completedOrders.stream()
                .map(Order::getCustomerName)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        
        // 计算平均单价
        BigDecimal avgPrice = orderCount > 0 ?
                totalAmount.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP) :
                BigDecimal.ZERO;
        
        return new SalesPerformance(salesName, orderCount, totalAmount, 
                customerCount, avgPrice);
    }
    
    // ==================== 公司整体统计 ====================
    
    public CompanyOverview getCompanyOverview(int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        
        List<Order> orders = orderRepository.findByDateRange(start, end);
        List<Order> completedOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .toList();
        
        BigDecimal totalRevenue = completedOrders.stream()
                .map(Order::getActualAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<User> salesUsers = userRepository.findByRole(UserRole.SALES);
        int activeSalesCount = (int) completedOrders.stream()
                .map(o -> o.getSales().getId())
                .distinct()
                .count();
        
        // 请求统计
        List<PickupRequest> requests = requestRepository.findByDateRange(
                start.atStartOfDay(), end.atTime(23, 59, 59));
        
        long totalRequests = requests.size();
        long approvedRequests = requests.stream()
                .filter(r -> r.getStatus() == RequestStatus.APPROVED || 
                            r.getStatus() == RequestStatus.ADJUSTED ||
                            r.getStatus() == RequestStatus.COMPLETED)
                .count();
        long rejectedRequests = requests.stream()
                .filter(r -> r.getStatus() == RequestStatus.REJECTED)
                .count();
        
        CompanyOverview overview = new CompanyOverview();
        overview.setYear(year);
        overview.setMonth(month);
        overview.setTotalOrders(completedOrders.size());
        overview.setTotalRevenue(totalRevenue);
        overview.setActiveSalesCount(activeSalesCount);
        overview.setTotalSalesCount(salesUsers.size());
        overview.setTotalRequests(totalRequests);
        overview.setApprovedRequests(approvedRequests);
        overview.setRejectedRequests(rejectedRequests);
        
        return overview;
    }
    
    // ==================== 内部类定义 ====================
    
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class MonthlyReport {
        private int year;
        private int month;
        private long orderCount;
        private BigDecimal totalAmount;
        private List<SalesPerformance> salesRanking;
        
        public MonthlyReport(int year, int month, long orderCount, BigDecimal totalAmount, List<SalesPerformance> salesRanking) {
            this.year = year;
            this.month = month;
            this.orderCount = orderCount;
            this.totalAmount = totalAmount;
            this.salesRanking = salesRanking;
        }
    }
    
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class SalesPerformance {
        private String salesName;
        private long orderCount;
        private BigDecimal totalAmount;
        private long customerCount;
        private BigDecimal avgPrice;
        
        public SalesPerformance(String salesName, long orderCount, BigDecimal totalAmount) {
            this.salesName = salesName;
            this.orderCount = orderCount;
            this.totalAmount = totalAmount;
        }
        
        public SalesPerformance(String salesName, long orderCount, BigDecimal totalAmount, long customerCount, BigDecimal avgPrice) {
            this.salesName = salesName;
            this.orderCount = orderCount;
            this.totalAmount = totalAmount;
            this.customerCount = customerCount;
            this.avgPrice = avgPrice;
        }
    }
    
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class CompanyOverview {
        private int year;
        private int month;
        private long totalOrders;
        private BigDecimal totalRevenue;
        private int activeSalesCount;
        private int totalSalesCount;
        private long totalRequests;
        private long approvedRequests;
        private long rejectedRequests;
        
        public CompanyOverview(int year, int month, long totalOrders, BigDecimal totalRevenue,
                            int activeSalesCount, int totalSalesCount, long totalRequests,
                            long approvedRequests, long rejectedRequests) {
            this.year = year;
            this.month = month;
            this.totalOrders = totalOrders;
            this.totalRevenue = totalRevenue;
            this.activeSalesCount = activeSalesCount;
            this.totalSalesCount = totalSalesCount;
            this.totalRequests = totalRequests;
            this.approvedRequests = approvedRequests;
            this.rejectedRequests = rejectedRequests;
        }
    }
}
