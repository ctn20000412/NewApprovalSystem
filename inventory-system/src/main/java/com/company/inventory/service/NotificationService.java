package com.company.inventory.service;

import com.company.inventory.entity.Notification;
import com.company.inventory.entity.Order;
import com.company.inventory.entity.PickupRequest;
import com.company.inventory.entity.User;
import com.company.inventory.enums.NotificationType;
import com.company.inventory.enums.UserRole;
import com.company.inventory.repository.NotificationRepository;
import com.company.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<Notification> findRecentNotifications(Long userId, int limit) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                userId,
                PageRequest.of(0, Math.max(limit, 1))
        );
    }

    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFlagFalse(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (Boolean.FALSE.equals(notification.getReadFlag())) {
            notification.setReadFlag(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByRecipientIdAndReadFlagFalse(userId);
        LocalDateTime now = LocalDateTime.now();
        notifications.forEach(notification -> {
            notification.setReadFlag(true);
            notification.setReadAt(now);
        });
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void notifyRequestCreated(PickupRequest request) {
        createForUsers(
                findActiveManagers(),
                NotificationType.REQUEST_CREATED,
                "新的取货申请待审批",
                String.format("%s 提交了申请 %s，客户：%s", request.getApplicant().getRealName(), request.getRequestNo(), request.getCustomerName()),
                "/requests/" + request.getId(),
                request.getId(),
                request.getApplicant().getId()
        );
    }

    @Transactional
    public void notifyRequestApproved(PickupRequest request) {
        createForUser(
                request.getApplicant(),
                NotificationType.REQUEST_APPROVED,
                "取货申请已通过",
                String.format("申请 %s 已通过审批，可以继续创建订单。", request.getRequestNo()),
                "/requests/" + request.getId(),
                request.getId()
        );
    }

    @Transactional
    public void notifyRequestRejected(PickupRequest request) {
        createForUser(
                request.getApplicant(),
                NotificationType.REQUEST_REJECTED,
                "取货申请被驳回",
                String.format("申请 %s 被驳回，请查看审批意见。", request.getRequestNo()),
                "/requests/" + request.getId(),
                request.getId()
        );
    }

    @Transactional
    public void notifyRequestAdjusted(PickupRequest request) {
        createForUser(
                request.getApplicant(),
                NotificationType.REQUEST_ADJUSTED,
                "取货申请已调整",
                String.format("申请 %s 已被调整，请确认审批结果。", request.getRequestNo()),
                "/requests/" + request.getId(),
                request.getId()
        );
    }

    @Transactional
    public void notifyOrderCreated(Order order, Long operatorId) {
        createForUsers(
                findActiveManagers(),
                NotificationType.ORDER_CREATED,
                "有新订单已创建",
                String.format("订单 %s 已创建，客户：%s。", order.getOrderNo(), order.getCustomerName()),
                "/orders/" + order.getId(),
                order.getId(),
                operatorId
        );
    }

    @Transactional
    public void notifyOrderCompleted(Order order, Long operatorId) {
        createForUsers(
                mergeRecipients(order.getSales(), findActiveManagers()),
                NotificationType.ORDER_COMPLETED,
                "订单已完成",
                String.format("订单 %s 已完成。", order.getOrderNo()),
                "/orders/" + order.getId(),
                order.getId(),
                operatorId
        );
    }

    @Transactional
    public void notifyOrderCancelled(Order order, Long operatorId) {
        createForUsers(
                mergeRecipients(order.getSales(), findActiveManagers()),
                NotificationType.ORDER_CANCELLED,
                "订单已取消",
                String.format("订单 %s 已取消，库存已回滚。", order.getOrderNo()),
                "/orders/" + order.getId(),
                order.getId(),
                operatorId
        );
    }

    private void createForUser(
            User recipient,
            NotificationType type,
            String title,
            String content,
            String targetPath,
            Long relatedId
    ) {
        if (recipient == null || recipient.getStatus() == null || recipient.getStatus() != 1) {
            return;
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setTargetPath(targetPath);
        notification.setRelatedId(relatedId);
        notification.setReadFlag(false);
        notificationRepository.save(notification);
    }

    private void createForUsers(
            Collection<User> recipients,
            NotificationType type,
            String title,
            String content,
            String targetPath,
            Long relatedId,
            Long excludeUserId
    ) {
        recipients.stream()
                .filter(user -> user != null && user.getStatus() != null && user.getStatus() == 1)
                .filter(user -> excludeUserId == null || !user.getId().equals(excludeUserId))
                .collect(Collectors.toMap(User::getId, user -> user, (left, right) -> left, LinkedHashMap::new))
                .values()
                .forEach(user -> createForUser(user, type, title, content, targetPath, relatedId));
    }

    private List<User> findActiveManagers() {
        return userRepository.findByRole(UserRole.MANAGER).stream()
                .filter(user -> user.getStatus() != null && user.getStatus() == 1)
                .collect(Collectors.toList());
    }

    private List<User> mergeRecipients(User primaryUser, List<User> managers) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        if (primaryUser != null) {
            recipients.put(primaryUser.getId(), primaryUser);
        }
        managers.forEach(manager -> recipients.put(manager.getId(), manager));
        return List.copyOf(recipients.values());
    }
}
