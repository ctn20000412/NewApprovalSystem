package com.company.inventory.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendRedirectController {

    private final String frontendUrl;

    public FrontendRedirectController(@Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    @GetMapping({
        "/",
        "/login",
        "/dashboard",
        "/requests",
        "/requests/**",
        "/orders",
        "/orders/**",
        "/products",
        "/products/**",
        "/warehouse",
        "/warehouse/**",
        "/users",
        "/users/**",
        "/reports",
        "/reports/**"
    })
    public String redirectToFrontend(HttpServletRequest request) {
        String target = frontendUrl + request.getRequestURI();
        String query = request.getQueryString();

        if (query != null && !query.isBlank()) {
            target = target + "?" + query;
        }

        return "redirect:" + target;
    }
}
