package com.company.inventory.service;

import com.company.inventory.entity.User;
import com.company.inventory.enums.UserRole;
import com.company.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<User> findByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    public List<User> findSalesUsers() {
        return userRepository.findByRole(UserRole.SALES);
    }

    @Transactional
    public User createUser(String username, String password, String realName, UserRole role) {
        return createUser(username, password, realName, role, null, null);
    }

    @Transactional
    public User createUser(String username, String password, String realName, UserRole role, String email, String phone) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRealName(realName);
        user.setRole(role);
        user.setEmail(email);
        user.setPhone(phone);
        user.setStatus(1);

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, String realName, String email, String phone) {
        return updateUser(id, realName, null, email, phone);
    }

    @Transactional
    public User updateUser(Long id, String realName, UserRole role, String email, String phone) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRealName(realName);
        if (role != null) {
            user.setRole(role);
        }
        user.setEmail(email);
        user.setPhone(phone);

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long id, String oldPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void disableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(0);
        userRepository.save(user);
    }

    @Transactional
    public void enableUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(1);
        userRepository.save(user);
    }
}
