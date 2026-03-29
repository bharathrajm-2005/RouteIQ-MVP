package com.routeiq.controller;

import com.routeiq.entity.Shipment;
import com.routeiq.service.CarbonService;
import com.routeiq.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final CarbonService carbonService;

    @PostMapping
    public ResponseEntity<Shipment> createShipment(@RequestBody Shipment shipment,
                                                    Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        shipment.setUserId(userId);

        // Calculate carbon if not already set
        if (shipment.getCarbonKg() == null) {
            double distance = estimateDistance(shipment.getOriginPin(), shipment.getDestPin());
            Map<String, Object> carbon = carbonService.calculateCarbon(
                    shipment.getCourierId(), distance, shipment.getWeightKg(), "van");
            shipment.setCarbonKg(((Number) carbon.get("carbonKg")).doubleValue());
        }

        return ResponseEntity.ok(shipmentService.createShipment(shipment));
    }

    @GetMapping
    public ResponseEntity<List<Shipment>> getShipments(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(shipmentService.getUserShipments(userId));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Shipment>> getRecentShipments(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(shipmentService.getRecentShipments(userId));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(shipmentService.getMonthlySummary(userId));
    }

    private double estimateDistance(String originPin, String destPin) {
        // Simple pin-to-distance estimate for Indian metros
        Map<String, double[]> pinCoords = Map.of(
                "110001", new double[]{28.6139, 77.2090}, // Delhi
                "400001", new double[]{19.0760, 72.8777}, // Mumbai
                "560001", new double[]{12.9716, 77.5946}, // Bangalore
                "700001", new double[]{22.5726, 88.3639}, // Kolkata
                "600001", new double[]{13.0827, 80.2707}, // Chennai
                "302001", new double[]{26.9124, 75.7873}  // Jaipur
        );
        double[] origin = pinCoords.getOrDefault(originPin, new double[]{20.0, 78.0});
        double[] dest = pinCoords.getOrDefault(destPin, new double[]{20.0, 78.0});
        double latDiff = Math.toRadians(dest[0] - origin[0]);
        double lonDiff = Math.toRadians(dest[1] - origin[1]);
        double a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
                Math.cos(Math.toRadians(origin[0])) * Math.cos(Math.toRadians(dest[0])) *
                Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371 * c * 1.3; // Haversine * 1.3 road factor
    }
}
