package com.company.inventory.controller.api;

import com.company.inventory.entity.Notification;
import com.company.inventory.entity.User;
import com.company.inventory.service.NotificationService;
import com.company.inventory.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class ApiNotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listNotifications(
            @RequestParam(defaultValue = "10") Integer limit
    ) {
        User currentUser = getCurrentUser();
        int safeLimit = Math.min(Math.max(limit, 1), 30);
        List<Notification> notifications = notificationService.findRecentNotifications(currentUser.getId(), safeLimit);
        return ResponseEntity.ok(notifications.stream().map(this::toNotificationResponse).collect(Collectors.toList()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> unreadCount() {
        User currentUser = getCurrentUser();
        Map<String, Object> response = new HashMap<>();
        response.put("count", notificationService.countUnreadNotifications(currentUser.getId()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        notificationService.markAsRead(currentUser.getId(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok().build();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userService.findByUsername(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("Not authenticated");
    }

    private Map<String, Object> toNotificationResponse(Notification notification) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", notification.getId());
        response.put("type", notification.getType().name());
        response.put("title", notification.getTitle());
        response.put("content", notification.getContent());
        response.put("targetPath", notification.getTargetPath());
        response.put("relatedId", notification.getRelatedId());
        response.put("read", notification.getReadFlag());
        response.put("readAt", notification.getReadAt());
        response.put("createdAt", notification.getCreatedAt());
        return response;
    }
}
