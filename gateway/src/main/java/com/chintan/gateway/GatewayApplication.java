package com.chintan.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = {
    org.springframework.cloud.autoconfigure.LifecycleMvcEndpointAutoConfiguration.class,
    org.springframework.cloud.autoconfigure.RefreshAutoConfiguration.class,
    org.springframework.cloud.client.discovery.simple.SimpleDiscoveryClientAutoConfiguration.class,
    org.springframework.cloud.client.discovery.simple.reactive.SimpleReactiveDiscoveryClientAutoConfiguration.class,
    org.springframework.cloud.client.loadbalancer.LoadBalancerAutoConfiguration.class,
    org.springframework.cloud.gateway.config.GatewayAutoConfiguration.class
})
public class GatewayApplication {

        public static void main(String[] args) {
                SpringApplication.run(GatewayApplication.class, args);
        }

}
