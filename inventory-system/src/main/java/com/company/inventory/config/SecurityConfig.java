package com.company.inventory.config;

import com.company.inventory.service.DatabaseUserDetailsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final DatabaseUserDetailsService userDetailsService;

    public SecurityConfig(DatabaseUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .userDetailsService(userDetailsService)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/error").permitAll()
                .requestMatchers(
                    HttpMethod.GET,
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
                ).permitAll()
                .requestMatchers("/login", "/auth/login", "/auth/logout").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .defaultAuthenticationEntryPointFor(
                    (request, response, exception) ->
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED),
                    new AntPathRequestMatcher("/api/**")
                )
            )
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/auth/login")
                .successHandler((request, response, authentication) -> {
                    if (isHtmlNavigation(request)) {
                        response.sendRedirect(frontendUrl + "/dashboard");
                        return;
                    }
                    response.setStatus(HttpServletResponse.SC_OK);
                })
                .failureHandler((request, response, exception) -> {
                    if (isHtmlNavigation(request)) {
                        response.sendRedirect(frontendUrl + "/login?error");
                        return;
                    }
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication failed");
                })
                .permitAll()
            )
            .logout(logout -> logout
                .logoutRequestMatcher(new AntPathRequestMatcher("/auth/logout"))
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((request, response, authentication) -> {
                    if (isHtmlNavigation(request)) {
                        response.sendRedirect(frontendUrl + "/login?logout");
                        return;
                    }
                    response.setStatus(HttpServletResponse.SC_OK);
                })
                .permitAll()
            )
            .csrf(csrf -> csrf.disable());
        
        return http.build();
    }

    private boolean isHtmlNavigation(HttpServletRequest request) {
        String accept = request.getHeader(HttpHeaders.ACCEPT);
        return accept != null && accept.contains(MediaType.TEXT_HTML_VALUE);
    }
}
