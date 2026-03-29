package com.routeiq.repository;

import com.routeiq.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    List<Alert> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
}
