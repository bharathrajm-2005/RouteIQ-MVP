package com.routeiq.repository;

import com.routeiq.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByUserIdOrderByDispatchedAtDesc(Long userId);

    List<Shipment> findTop10ByUserIdOrderByDispatchedAtDesc(Long userId);

    @Query("SELECT s FROM Shipment s WHERE s.userId = :userId AND s.dispatchedAt >= :startDate")
    List<Shipment> findByUserIdAndDispatchedAtAfter(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.userId = :userId AND s.dispatchedAt >= :startDate")
    Long countByUserIdAndMonth(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT s FROM Shipment s WHERE s.dispatchedAt >= :startDate AND s.dispatchedAt < :endDate")
    List<Shipment> findByMonth(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT s FROM Shipment s WHERE s.userId = :userId AND s.dispatchedAt >= :startDate AND s.dispatchedAt < :endDate")
    List<Shipment> findByUserIdAndMonth(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
