package com.routeiq.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NLQueryService {

    private final RestTemplate restTemplate;
    private final ShipmentService shipmentService;

    @Value("${app.claude.api-key}")
    private String claudeApiKey;

    @Value("${app.claude.model}")
    private String claudeModel;

    public String processQuery(Long userId, String question, String pageContext) {
        try {
            Map<String, Object> summary = shipmentService.getMonthlySummary(userId);

            String systemPrompt = String.format(
                "You are RouteIQ's logistics assistant. Answer only questions about courier SLA performance, " +
                "carbon emissions, dispatch recommendations, and logistics operations. Be concise. " +
                "Use the following data context: " +
                "Total shipments this month: %s, Average SLA rate: %.1f%%, Total CO₂: %.2f kg. " +
                "Additional context: %s",
                summary.get("totalShipments"),
                ((Number) summary.get("avgSlaRate")).doubleValue() * 100,
                ((Number) summary.get("totalCarbonKg")).doubleValue(),
                pageContext != null ? pageContext : "Dashboard overview"
            );

            Map<String, Object> request = new LinkedHashMap<>();
            request.put("model", claudeModel);
            request.put("max_tokens", 500);
            request.put("system", systemPrompt);
            request.put("messages", List.of(
                Map.of("role", "user", "content", question)
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", claudeApiKey);
            headers.set("anthropic-version", "2023-06-01");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    "https://api.anthropic.com/v1/messages", entity, Map.class);

            if (response != null && response.containsKey("content")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
                if (!content.isEmpty()) {
                    return (String) content.get(0).get("text");
                }
            }

            return "I couldn't process your question. Please try again.";
        } catch (Exception e) {
            log.error("NL Query failed: {}", e.getMessage());
            return "I'm having trouble connecting right now. Please ensure the Claude API key is configured. Error: " + e.getMessage();
        }
    }
}
