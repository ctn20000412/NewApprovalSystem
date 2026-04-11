package com.company.inventory.repository;

import com.company.inventory.entity.User;
import com.company.inventory.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    List<User> findByRole(UserRole role);
    
    List<User> findByStatus(Integer status);
    
    boolean existsByUsername(String username);
}
