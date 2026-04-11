package com.company.inventory.controller.api;

import com.company.inventory.entity.User;
import com.company.inventory.enums.UserRole;
import com.company.inventory.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class ApiUserController {

    private final UserService userService;

    public ApiUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<?> listUsers() {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        List<Map<String, Object>> users = userService.findAll().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        User user = userService.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toUserResponse(user));
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> data) {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            String username = getRequiredString(data, "username");
            String password = getRequiredString(data, "password");
            String realName = getRequiredString(data, "realName");
            UserRole role = parseRole(data.get("role"));
            String email = getOptionalString(data, "email");
            String phone = getOptionalString(data, "phone");

            User user = userService.createUser(username, password, realName, role, email, phone);
            return ResponseEntity.ok(toUserResponse(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            String realName = getRequiredString(data, "realName");
            UserRole role = parseRole(data.get("role"));
            String email = getOptionalString(data, "email");
            String phone = getOptionalString(data, "phone");

            User user = userService.updateUser(id, realName, role, email, phone);
            return ResponseEntity.ok(toUserResponse(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/enable")
    public ResponseEntity<?> enableUser(@PathVariable Long id) {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        try {
            userService.enableUser(id);
            User user = userService.findById(id).orElse(null);
            return ResponseEntity.ok(user != null ? toUserResponse(user) : Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/disable")
    public ResponseEntity<?> disableUser(@PathVariable Long id) {
        ResponseEntity<?> forbidden = requireManager();
        if (forbidden != null) {
            return forbidden;
        }

        User currentUser = getCurrentUser();
        if (currentUser != null && currentUser.getId().equals(id)) {
            return ResponseEntity.badRequest().body("Error: current logged-in manager cannot be disabled");
        }

        try {
            userService.disableUser(id);
            User user = userService.findById(id).orElse(null);
            return ResponseEntity.ok(user != null ? toUserResponse(user) : Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
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

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userService.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    private String getRequiredString(Map<String, Object> data, String key) {
        String value = getOptionalString(data, key);
        if (value == null || value.isBlank()) {
            throw new RuntimeException(key + " is required");
        }
        return value;
    }

    private String getOptionalString(Map<String, Object> data, String key) {
        Object value = data.get(key);
        return value == null ? null : value.toString().trim();
    }

    private UserRole parseRole(Object value) {
        if (value == null) {
            throw new RuntimeException("role is required");
        }
        return UserRole.valueOf(value.toString().trim().toUpperCase());
    }

    private Map<String, Object> toUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("realName", user.getRealName());
        response.put("role", user.getRole().name());
        response.put("roleDescription", user.getRole().getDescription());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("status", user.getStatus());
        response.put("createdAt", user.getCreatedAt());
        response.put("updatedAt", user.getUpdatedAt());
        return response;
    }
}
