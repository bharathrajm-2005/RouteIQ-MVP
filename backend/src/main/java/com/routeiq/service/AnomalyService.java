package com.routeiq.service;

import com.routeiq.entity.Alert;
import com.routeiq.entity.CourierMetric;
import com.routeiq.entity.CourierOption;
import com.routeiq.repository.AlertRepository;
import com.routeiq.repository.CourierMetricRepository;
import com.routeiq.repository.CourierOptionRepository;
import com.routeiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyService {

    private final CourierMetricRepository metricRepo;
    private final AlertRepository alertRepo;
    private final CourierOptionRepository courierOptionRepo;
    private final UserRepository userRepo;
    private final RestTemplate restTemplate;

    @Value("${app.python.base-url}")
    private String pythonBaseUrl;

    // Track which corridors are currently degraded
    private final Set<String> degradedCorridors = Collections.synchronizedSet(new HashSet<>());

    public boolean isCorridorDegraded(String corridorKey, Long courierId) {
        return degradedCorridors.contains(corridorKey + ":" + courierId);
    }

    @Scheduled(fixedRate = 900000) // every 15 minutes
    public void runAnomalyDetection() {
        log.info("Running anomaly detection scan...");
        List<String> corridors = metricRepo.findDistinctCorridorKeys();

        for (String corridorKey : corridors) {
            List<Long> courierIds = metricRepo.findDistinctCourierIdsByCorridorKey(corridorKey);

            for (Long courierId : courierIds) {
                try {
                    List<CourierMetric> metrics = metricRepo
                            .findByCourierIdAndCorridorKeyOrderByRecordedAtDesc(courierId, corridorKey);

                    if (metrics.size() < 10) continue;

                    // Take last 50 records
                    List<CourierMetric> metricsSubset = metrics.subList(0, Math.min(50, metrics.size()));

                    // Build request for Python service
                    Map<String, Object> request = new HashMap<>();
                    request.put("corridorKey", corridorKey);
                    request.put("metrics", metricsSubset.stream()
                            .map(m -> Map.of(
                                    "slaRate", m.getSlaRate(),
                                    "avgDelayMin", m.getAvgDelayMin(),
                                    "recordedAt", m.getRecordedAt().toString()
                            )).collect(Collectors.toList()));

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

                    @SuppressWarnings("unchecked")
                    Map<String, Object> response = restTemplate.postForObject(
                            pythonBaseUrl + "/detect", entity, Map.class);

                    if (response != null && Boolean.TRUE.equals(response.get("anomalyDetected"))) {
                        String key = corridorKey + ":" + courierId;
                        degradedCorridors.add(key);

                        String severity = (String) response.getOrDefault("severity", "medium");
                        String courierName = courierOptionRepo.findById(courierId)
                                .map(CourierOption::getName).orElse("Unknown");

                        // Create alerts for all users
                        userRepo.findAll().forEach(user -> {
                            Alert alert = Alert.builder()
                                    .userId(user.getId())
                                    .corridorKey(corridorKey)
                                    .courierId(courierId)
                                    .courierName(courierName)
                                    .alertType("CORRIDOR_DEGRADATION")
                                    .severity(severity)
                                    .message(String.format(
                                            "⚠️ %s is showing SLA degradation on corridor %s. " +
                                            "Current SLA rate has dropped significantly. " +
                                            "Consider re-routing shipments via alternative courier.",
                                            courierName, corridorKey))
                                    .build();
                            alertRepo.save(alert);
                        });

                        log.warn("Anomaly detected: {} on corridor {} (severity: {})",
                                courierName, corridorKey, severity);
                    } else {
                        degradedCorridors.remove(corridorKey + ":" + courierId);
                    }
                } catch (Exception e) {
                    log.error("Anomaly detection failed for corridor {} courier {}: {}",
                            corridorKey, courierId, e.getMessage());
                }
            }
        }
        log.info("Anomaly detection scan complete. Degraded corridors: {}", degradedCorridors.size());
    }

    public List<Alert> getUnreadAlerts(Long userId) {
        return alertRepo.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public List<Alert> getAllAlerts(Long userId) {
        return alertRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return alertRepo.countByUserIdAndIsReadFalse(userId);
    }

    public Alert markAsRead(Long alertId) {
        Alert alert = alertRepo.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setIsRead(true);
        return alertRepo.save(alert);
    }
}
