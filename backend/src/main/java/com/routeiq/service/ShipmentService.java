package com.routeiq.service;

import com.routeiq.entity.Shipment;
import com.routeiq.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepo;

    public Shipment createShipment(Shipment shipment) {
        return shipmentRepo.save(shipment);
    }

    public List<Shipment> getUserShipments(Long userId) {
        return shipmentRepo.findByUserIdOrderByDispatchedAtDesc(userId);
    }

    public List<Shipment> getRecentShipments(Long userId) {
        return shipmentRepo.findTop10ByUserIdOrderByDispatchedAtDesc(userId);
    }

    public Map<String, Object> getMonthlySummary(Long userId) {
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        List<Shipment> shipments = shipmentRepo.findByUserIdAndDispatchedAtAfter(userId, startOfMonth);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalShipments", shipments.size());
        summary.put("avgSlaRate", shipments.stream()
                .filter(s -> s.getSlaScore() != null)
                .mapToDouble(Shipment::getSlaScore)
                .average().orElse(0.0));
        summary.put("totalCarbonKg", shipments.stream()
                .filter(s -> s.getCarbonKg() != null)
                .mapToDouble(Shipment::getCarbonKg)
                .sum());
        summary.put("totalCost", shipments.stream()
                .filter(s -> s.getCost() != null)
                .mapToDouble(Shipment::getCost)
                .sum());

        return summary;
    }

    public Map<String, Object> getCarbonReport(Long userId, int month, int year) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDateTime start = ym.atDay(1).atStartOfDay();
        LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();

        List<Shipment> shipments = shipmentRepo.findByUserIdAndMonth(userId, start, end);

        // Previous month
        YearMonth prevYm = ym.minusMonths(1);
        LocalDateTime prevStart = prevYm.atDay(1).atStartOfDay();
        LocalDateTime prevEnd = prevYm.plusMonths(1).atDay(1).atStartOfDay();
        List<Shipment> prevShipments = shipmentRepo.findByUserIdAndMonth(userId, prevStart, prevEnd);

        double totalCarbon = shipments.stream()
                .filter(s -> s.getCarbonKg() != null)
                .mapToDouble(Shipment::getCarbonKg).sum();
        double prevTotalCarbon = prevShipments.stream()
                .filter(s -> s.getCarbonKg() != null)
                .mapToDouble(Shipment::getCarbonKg).sum();
        double avgCarbon = shipments.isEmpty() ? 0 : totalCarbon / shipments.size();
        double changePercent = prevTotalCarbon > 0
                ? ((totalCarbon - prevTotalCarbon) / prevTotalCarbon) * 100 : 0;

        // Courier breakdown
        Map<String, Double> courierBreakdown = shipments.stream()
                .filter(s -> s.getCarbonKg() != null && s.getCourierName() != null)
                .collect(Collectors.groupingBy(
                        Shipment::getCourierName,
                        Collectors.summingDouble(Shipment::getCarbonKg)));

        // Find lowest carbon courier
        String lowestCarbonCourier = courierBreakdown.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("N/A");

        // Daily CO2 trend
        Map<String, Double> dailyTrend = shipments.stream()
                .filter(s -> s.getCarbonKg() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getDispatchedAt().toLocalDate().toString(),
                        TreeMap::new,
                        Collectors.summingDouble(Shipment::getCarbonKg)));

        // Potential savings
        double lowestCourierAvg = courierBreakdown.isEmpty() ? 0 :
                Collections.min(courierBreakdown.values()) /
                        shipments.stream().filter(s -> s.getCourierName() != null && s.getCourierName().equals(lowestCarbonCourier)).count();
        double potentialSavings = totalCarbon - (lowestCourierAvg * shipments.size());

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("month", month);
        report.put("year", year);
        report.put("totalShipments", shipments.size());
        report.put("totalCarbonKg", Math.round(totalCarbon * 100.0) / 100.0);
        report.put("avgCarbonPerShipment", Math.round(avgCarbon * 100.0) / 100.0);
        report.put("comparedToPreviousMonth", Math.round(changePercent * 100.0) / 100.0);
        report.put("courierBreakdown", courierBreakdown.entrySet().stream()
                .map(e -> Map.of("courier", e.getKey(), "carbonKg", Math.round(e.getValue() * 100.0) / 100.0))
                .collect(Collectors.toList()));
        report.put("dailyTrend", dailyTrend.entrySet().stream()
                .map(e -> Map.of("date", e.getKey(), "carbonKg", Math.round(e.getValue() * 100.0) / 100.0))
                .collect(Collectors.toList()));
        report.put("lowestCarbonCourier", lowestCarbonCourier);
        report.put("potentialSavingsKg", Math.round(Math.max(0, potentialSavings) * 100.0) / 100.0);

        return report;
    }
}
