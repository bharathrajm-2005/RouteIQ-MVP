package com.routeiq.repository;

import com.routeiq.entity.CourierOption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CourierOptionRepository extends JpaRepository<CourierOption, Long> {
    Optional<CourierOption> findByName(String name);
}
