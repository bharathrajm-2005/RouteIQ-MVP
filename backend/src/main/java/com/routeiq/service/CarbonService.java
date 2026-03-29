package com.routeiq.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarbonService {

    private final RestTemplate restTemplate;

    @Value("${app.python.base-url}")
    private String pythonBaseUrl;

    @SuppressWarnings("unchecked")
    public Map<String, Object> calculateCarbon(Long courierId, Double distanceKm, Double weightKg, String vehicleType) {
        Map<String, Object> request = new HashMap<>();
        request.put("courierId", courierId);
        request.put("distanceKm", distanceKm);
        request.put("weightKg", weightKg);
        request.put("vehicleType", vehicleType);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            Map<String, Object> response = restTemplate.postForObject(
                    pythonBaseUrl + "/carbon", entity, Map.class);

            return response != null ? response : fallbackCalculation(distanceKm, weightKg, vehicleType);
        } catch (Exception e) {
            log.error("Carbon service call failed: {}", e.getMessage());
            return fallbackCalculation(distanceKm, weightKg, vehicleType);
        }
    }

    private Map<String, Object> fallbackCalculation(Double distanceKm, Double weightKg, String vehicleType) {
        Map<String, Double> factors = Map.of(
                "bike", 0.05, "van", 0.15, "truck", 0.20, "air", 0.60
        );
        double factor = factors.getOrDefault(vehicleType, 0.15);
        double carbonKg = (weightKg / 1000.0) * distanceKm * factor;

        Map<String, Object> result = new HashMap<>();
        result.put("carbonKg", Math.round(carbonKg * 100.0) / 100.0);
        result.put("vehicleType", vehicleType);
        result.put("emissionFactor", factor);
        return result;
    }
}
