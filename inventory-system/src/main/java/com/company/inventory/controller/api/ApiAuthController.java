package com.company.inventory.controller.api;

import com.company.inventory.entity.User;
import com.company.inventory.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiAuthController {

    private final UserService userService;

    public ApiAuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/user/current")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            User user = userService.findByUsername(auth.getName()).orElse(null);
            if (user != null) {
                return ResponseEntity.ok(toUserResponse(user));
            }
        }
        return ResponseEntity.status(401).body("Not authenticated");
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
        return response;
    }
}
