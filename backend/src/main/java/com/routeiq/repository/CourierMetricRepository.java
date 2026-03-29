package com.routeiq.repository;

import com.routeiq.entity.CourierMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CourierMetricRepository extends JpaRepository<CourierMetric, Long> {
    @Query("SELECT cm FROM CourierMetric cm WHERE cm.corridorKey = :corridorKey ORDER BY cm.recordedAt DESC")
    List<CourierMetric> findTop50ByCorridorKey(@Param("corridorKey") String corridorKey);

    @Query("SELECT DISTINCT cm.corridorKey FROM CourierMetric cm")
    List<String> findDistinctCorridorKeys();

    List<CourierMetric> findByCourierIdAndCorridorKeyOrderByRecordedAtDesc(Long courierId, String corridorKey);

    @Query("SELECT DISTINCT cm.courierId FROM CourierMetric cm WHERE cm.corridorKey = :corridorKey")
    List<Long> findDistinctCourierIdsByCorridorKey(@Param("corridorKey") String corridorKey);
}
