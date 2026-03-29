package com.routeiq.controller;

import com.routeiq.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(
            @RequestParam String originPin,
            @RequestParam String destPin,
            @RequestParam Double weightKg) {
        return ResponseEntity.ok(
                recommendationService.getRecommendations(originPin, destPin, weightKg));
    }
}
