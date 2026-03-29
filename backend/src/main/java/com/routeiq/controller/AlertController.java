package com.routeiq.controller;

import com.routeiq.entity.Alert;
import com.routeiq.service.AnomalyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AnomalyService anomalyService;

    @GetMapping
    public ResponseEntity<List<Alert>> getAlerts(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(anomalyService.getAllAlerts(userId));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Alert>> getUnreadAlerts(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(anomalyService.getUnreadAlerts(userId));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("count", anomalyService.getUnreadCount(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Alert> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(anomalyService.markAsRead(id));
    }
}
