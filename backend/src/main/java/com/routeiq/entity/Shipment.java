package com.routeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long courierId;

    @Column(nullable = false)
    private String courierName;

    @Column(nullable = false)
    private String originPin;

    @Column(nullable = false)
    private String destPin;

    @Column(nullable = false)
    private Double weightKg;

    @Column(nullable = false)
    private LocalDateTime dispatchedAt;

    @Column(nullable = false)
    private String status;

    private Double slaScore;

    private Double carbonKg;

    private Double cost;

    @PrePersist
    protected void onCreate() {
        this.dispatchedAt = LocalDateTime.now();
        if (this.status == null) this.status = "DISPATCHED";
    }
}
