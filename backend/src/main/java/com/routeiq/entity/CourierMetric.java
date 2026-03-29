package com.routeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "courier_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourierMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courierId;

    @Column(nullable = false)
    private String corridorKey;

    @Column(nullable = false)
    private Double avgDelayMin;

    @Column(nullable = false)
    private Double slaRate;

    @Column(nullable = false)
    private LocalDateTime recordedAt;
}
