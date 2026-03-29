package com.routeiq.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courier_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourierOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Double baseRatePerKg;

    @Column(nullable = false)
    private Double avgSlaRate;

    private String apiKey;
}
