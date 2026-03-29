package com.routeiq.controller;

import com.routeiq.service.CarbonService;
import com.routeiq.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/carbon")
@RequiredArgsConstructor
public class CarbonController {

    private final CarbonService carbonService;
    private final ShipmentService shipmentService;

    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculate(@RequestBody Map<String, Object> request) {
        Long courierId = ((Number) request.get("courierId")).longValue();
        Double distanceKm = ((Number) request.get("distanceKm")).doubleValue();
        Double weightKg = ((Number) request.get("weightKg")).doubleValue();
        String vehicleType = (String) request.getOrDefault("vehicleType", "van");

        return ResponseEntity.ok(carbonService.calculateCarbon(courierId, distanceKm, weightKg, vehicleType));
    }

    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getReport(
            @RequestParam int month, @RequestParam int year,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(shipmentService.getCarbonReport(userId, month, year));
    }
}
