package com.routeiq;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RouteIqApplication {
    public static void main(String[] args) {
        SpringApplication.run(RouteIqApplication.class, args);
    }
}
