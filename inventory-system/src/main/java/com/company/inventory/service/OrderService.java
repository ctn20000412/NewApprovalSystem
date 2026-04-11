package com.company.inventory.service;

import com.company.inventory.entity.*;
import com.company.inventory.enums.ChangeType;
import com.company.inventory.enums.OrderStatus;
import com.company.inventory.enums.RequestStatus;
import com.company.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final PickupRequestRepository requestRepository;
    private final ProductService productService;
    private final UserService userService;
    private final InventoryLogRepository inventoryLogRepository;
    private final NotificationService notificationService;
    
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    
    public List<Order> findAllOrders() {
        return orderRepository.findAll();
    }
    
    public Optional<Order> findOrderById(Long id) {
        return orderRepository.findById(id);
    }
    
    public List<Order> findBySalesId(Long salesId) {
        return orderRepository.findBySalesId(salesId);
    }
    
    public List<Order> findByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }
    
    @Transactional
    public Order createOrderFromRequest(Long requestId, Long salesId, BigDecimal actualAmount, String remark) {
        PickupRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("请求不存在"));
        
        if (request.getStatus() != RequestStatus.APPROVED && 
            request.getStatus() != RequestStatus.ADJUSTED) {
            throw new RuntimeException("只能对已审核通过的请求创建订单");
        }
        
        User sales = userService.findById(salesId)
                .orElseThrow(() -> new RuntimeException("销售人员不存在"));
        
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setRequest(request);
        order.setSales(sales);
        order.setCustomerName(request.getCustomerName());
        order.setProjectName(request.getProjectName());
        order.setTotalAmount(request.getApprovedAmount());
        order.setActualAmount(actualAmount);
        order.setOrderDate(LocalDate.now());
        order.setStatus(OrderStatus.CONFIRMED);
        order.setRemark(remark);
        
        // 扣减库存
        User operator = userService.findById(salesId).orElse(null);
        for (RequestItem item : request.getItems()) {
            Product product = item.getProduct();
            int approvedQty = item.getApprovedQuantity() != null ? 
                    item.getApprovedQuantity() : item.getQuantity();
            
            // 记录库存变动
            InventoryLog log = new InventoryLog();
            log.setProduct(product);
            log.setOrder(order);
            log.setChangeType(ChangeType.OUT);
            log.setQuantity(approvedQty);
            log.setBeforeQuantity(product.getStockQuantity());
            log.setAfterQuantity(product.getStockQuantity() - approvedQty);
            log.setOperator(operator);
            log.setRemark("订单出库: " + order.getOrderNo());
            inventoryLogRepository.save(log);
            
            // 扣减库存
            productService.adjustStock(product.getId(), -approvedQty);
        }
        
        // 更新请求状态
        request.setStatus(RequestStatus.COMPLETED);
        requestRepository.save(request);
        
        Order savedOrder = orderRepository.save(order);
        notificationService.notifyOrderCreated(savedOrder, salesId);
        return savedOrder;
    }
    
    @Transactional
    public Order updateOrder(Long orderId, BigDecimal actualAmount, String remark) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        
        if (order.getStatus() != OrderStatus.PENDING && 
            order.getStatus() != OrderStatus.CONFIRMED) {
            throw new RuntimeException("只能修改待确认或已确认状态的订单");
        }
        
        order.setActualAmount(actualAmount);
        order.setRemark(remark);
        
        return orderRepository.save(order);
    }
    
    @Transactional
    public void completeOrder(Long orderId, Long operatorId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new RuntimeException("只能确认已确认状态的订单");
        }
        
        order.setStatus(OrderStatus.COMPLETED);
        order.setCompletedAt(LocalDateTime.now());
        orderRepository.save(order);
        notificationService.notifyOrderCompleted(order, operatorId);
    }
    
    @Transactional
    public void cancelOrder(Long orderId, Long operatorId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        
        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("无法取消已完成的订单");
        }
        
        // 返还库存
        if (order.getRequest() != null) {
            for (RequestItem item : order.getRequest().getItems()) {
                int qty = item.getApprovedQuantity() != null ? 
                        item.getApprovedQuantity() : item.getQuantity();
                Product product = item.getProduct();
                int beforeQuantity = product.getStockQuantity();

                InventoryLog log = new InventoryLog();
                log.setProduct(product);
                log.setOrder(order);
                log.setChangeType(ChangeType.IN);
                log.setQuantity(qty);
                log.setBeforeQuantity(beforeQuantity);
                log.setAfterQuantity(beforeQuantity + qty);
                log.setOperator(order.getSales());
                log.setRemark("鍙栨秷璁㈠崟鍥炲簱: " + order.getOrderNo());
                inventoryLogRepository.save(log);

                productService.adjustStock(product.getId(), qty);
            }
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        notificationService.notifyOrderCancelled(order, operatorId);
    }
    
    public List<Order> findByDateRange(LocalDate start, LocalDate end) {
        return orderRepository.findByDateRange(start, end);
    }
    
    public List<Order> findBySalesIdAndDateRange(Long salesId, LocalDate start, LocalDate end) {
        return orderRepository.findBySalesIdAndDateRange(salesId, start, end);
    }
    
    private String generateOrderNo() {
        return "ORD" + LocalDateTime.now().format(DATE_FORMAT);
    }
}
