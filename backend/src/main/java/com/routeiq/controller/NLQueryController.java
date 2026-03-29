package com.routeiq.controller;

import com.routeiq.service.NLQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/query")
@RequiredArgsConstructor
public class NLQueryController {

    private final NLQueryService nlQueryService;

    @PostMapping
    public ResponseEntity<Map<String, String>> query(@RequestBody Map<String, String> request,
                                                      Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        String question = request.get("question");
        String pageContext = request.getOrDefault("pageContext", "");

        String answer = nlQueryService.processQuery(userId, question, pageContext);
        return ResponseEntity.ok(Map.of("answer", answer));
    }
}
