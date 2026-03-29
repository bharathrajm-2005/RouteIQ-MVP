package com.routeiq.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String corridorKey;

    @Column(nullable = false)
    private Long courierId;

    private String courierName;

    @Column(nullable = false)
    private String alertType;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean isRead;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isRead == null) this.isRead = false;
    }
}
