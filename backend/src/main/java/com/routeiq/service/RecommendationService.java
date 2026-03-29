package com.routeiq.service;

import com.routeiq.entity.CourierOption;
import com.routeiq.repository.CourierOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final CourierOptionRepository courierOptionRepo;
    private final AnomalyService anomalyService;
    private final RestTemplate restTemplate;

    @Value("${app.python.base-url}")
    private String pythonBaseUrl;

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getRecommendations(String originPin, String destPin, Double weightKg) {
        List<CourierOption> couriers = courierOptionRepo.findAll();
        String corridorKey = originPin + "-" + destPin;

        List<Map<String, Object>> courierData = couriers.stream().map(c -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", c.getId());
            data.put("name", c.getName());
            data.put("baseRatePerKg", c.getBaseRatePerKg());
            data.put("avgSlaRate", c.getAvgSlaRate());
            data.put("isAnomalous", anomalyService.isCorridorDegraded(corridorKey, c.getId()));
            return data;
        }).collect(Collectors.toList());

        Map<String, Object> request = new HashMap<>();
        request.put("originPin", originPin);
        request.put("destPin", destPin);
        request.put("weightKg", weightKg);
        request.put("couriers", courierData);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            List<Map<String, Object>> response = restTemplate.postForObject(
                    pythonBaseUrl + "/rank", entity, List.class);

            if (response != null && !response.isEmpty()) {
                // Flag top result as recommended
                response.get(0).put("isRecommended", true);
                for (int i = 1; i < response.size(); i++) {
                    response.get(i).put("isRecommended", false);
                }
            }

            return response != null ? response : Collections.emptyList();
        } catch (Exception e) {
            log.error("Recommendation service call failed: {}", e.getMessage());
            // Fallback: return basic recommendation without Python service
            return couriers.stream().map(c -> {
                Map<String, Object> rec = new LinkedHashMap<>();
                rec.put("courierId", c.getId());
                rec.put("courierName", c.getName());
                rec.put("predictedSlaRate", c.getAvgSlaRate());
                rec.put("estimatedCost", c.getBaseRatePerKg() * weightKg);
                rec.put("estimatedCarbonKg", (weightKg / 1000.0) * 800 * 0.15);
                rec.put("recommendationScore", c.getAvgSlaRate() * 0.5 + 0.3);
                rec.put("isRecommended", false);
                return rec;
            }).collect(Collectors.toList());
        }
    }
}
