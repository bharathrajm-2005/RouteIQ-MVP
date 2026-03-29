package com.routeiq.config;

import com.routeiq.entity.CourierMetric;
import com.routeiq.entity.CourierOption;
import com.routeiq.entity.Shipment;
import com.routeiq.entity.User;
import com.routeiq.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CourierOptionRepository courierOptionRepo;
    private final CourierMetricRepository courierMetricRepo;
    private final ShipmentRepository shipmentRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (courierOptionRepo.count() > 0) {
            log.info("Seed data already exists, skipping...");
            return;
        }

        log.info("Seeding initial data...");
        seedCourierOptions();
        seedDemoUser();
        seedCourierMetrics();
        seedShipments();
        log.info("Seed data complete.");
    }

    private void seedCourierOptions() {
        courierOptionRepo.saveAll(List.of(
            CourierOption.builder().name("Shiprocket").baseRatePerKg(28.0).avgSlaRate(0.88).apiKey("SR_DEMO_KEY").build(),
            CourierOption.builder().name("Delhivery").baseRatePerKg(32.0).avgSlaRate(0.92).apiKey("DL_DEMO_KEY").build(),
            CourierOption.builder().name("EcomExpress").baseRatePerKg(25.0).avgSlaRate(0.85).apiKey("EE_DEMO_KEY").build()
        ));
        log.info("Seeded 3 courier options");
    }

    private void seedDemoUser() {
        if (!userRepo.existsByEmail("demo@routeiq.in")) {
            userRepo.save(User.builder()
                    .email("demo@routeiq.in")
                    .password(passwordEncoder.encode("demo123"))
                    .companyName("DemoStore India")
                    .build());
            log.info("Seeded demo user: demo@routeiq.in / demo123");
        }
    }

    private void seedCourierMetrics() {
        Random rng = new Random(42);
        List<CourierMetric> metrics = new ArrayList<>();

        String[] corridors = {"110001-400001", "110001-560001", "400001-700001", "560001-600001", "110001-302001"};
        List<CourierOption> couriers = courierOptionRepo.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (String corridor : corridors) {
            for (CourierOption courier : couriers) {
                // 30 days of metrics, 4 records per day = 120 records per corridor-courier
                for (int day = 30; day >= 0; day--) {
                    for (int hour = 0; hour < 24; hour += 6) {
                        LocalDateTime recordedAt = now.minusDays(day).withHour(hour).withMinute(0);

                        double baseSla = courier.getAvgSlaRate();
                        double baseDelay = 15.0;

                        // Shiprocket (id=1) on corridor 110001-400001: degradation spike in last 2 hours
                        boolean isDegraded = courier.getName().equals("Shiprocket")
                                && corridor.equals("110001-400001")
                                && day == 0 && hour >= 18;

                        double slaRate;
                        double avgDelayMin;

                        if (isDegraded) {
                            // Severe degradation
                            slaRate = 0.35 + rng.nextDouble() * 0.15; // 35-50%
                            avgDelayMin = 90 + rng.nextDouble() * 60;  // 90-150 min delay
                        } else {
                            // Normal fluctuation
                            slaRate = baseSla + (rng.nextDouble() - 0.5) * 0.1;
                            slaRate = Math.max(0.6, Math.min(1.0, slaRate));
                            avgDelayMin = baseDelay + (rng.nextDouble() - 0.5) * 10;
                            avgDelayMin = Math.max(2, avgDelayMin);
                        }

                        metrics.add(CourierMetric.builder()
                                .courierId(courier.getId())
                                .corridorKey(corridor)
                                .slaRate(Math.round(slaRate * 100.0) / 100.0)
                                .avgDelayMin(Math.round(avgDelayMin * 10.0) / 10.0)
                                .recordedAt(recordedAt)
                                .build());
                    }
                }
            }
        }

        courierMetricRepo.saveAll(metrics);
        log.info("Seeded {} courier metrics across {} corridors", metrics.size(), corridors.length);
    }

    private void seedShipments() {
        User demoUser = userRepo.findByEmail("demo@routeiq.in").orElseThrow();
        List<CourierOption> couriers = courierOptionRepo.findAll();
        Random rng = new Random(42);

        String[][] routes = {
            {"110001", "400001"}, {"110001", "560001"}, {"400001", "700001"},
            {"560001", "600001"}, {"110001", "302001"}
        };
        String[] statuses = {"DELIVERED", "DELIVERED", "DELIVERED", "IN_TRANSIT", "DISPATCHED"};

        List<Shipment> shipments = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 50; i++) {
            CourierOption courier = couriers.get(rng.nextInt(couriers.size()));
            String[] route = routes[rng.nextInt(routes.length)];
            double weightKg = 0.5 + rng.nextDouble() * 4.5;
            double cost = courier.getBaseRatePerKg() * weightKg * (1 + rng.nextDouble() * 0.3);
            double carbonKg = (weightKg / 1000.0) * 800 * 0.15; // avg distance 800km, van factor
            double slaScore = courier.getAvgSlaRate() + (rng.nextDouble() - 0.5) * 0.1;
            slaScore = Math.max(0.5, Math.min(1.0, slaScore));

            shipments.add(Shipment.builder()
                    .userId(demoUser.getId())
                    .courierId(courier.getId())
                    .courierName(courier.getName())
                    .originPin(route[0])
                    .destPin(route[1])
                    .weightKg(Math.round(weightKg * 10.0) / 10.0)
                    .dispatchedAt(now.minusDays(rng.nextInt(30)).minusHours(rng.nextInt(24)))
                    .status(statuses[rng.nextInt(statuses.length)])
                    .slaScore(Math.round(slaScore * 100.0) / 100.0)
                    .carbonKg(Math.round(carbonKg * 100.0) / 100.0)
                    .cost(Math.round(cost * 100.0) / 100.0)
                    .build());
        }

        shipmentRepo.saveAll(shipments);
        log.info("Seeded {} shipments for demo user", shipments.size());
    }
}
