package com.chintan.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class BlacklistFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(BlacklistFilter.class);
    private final ReactiveStringRedisTemplate redisTemplate;

    public BlacklistFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        log.info("BlacklistFilter invoked for user: {}", userId);
        
        if (userId == null) {
            return chain.filter(exchange);
        }

        return redisTemplate.opsForValue().get("blacklist:" + userId)
                .defaultIfEmpty("false")
                .flatMap(isBlacklisted -> {
                    if (Boolean.parseBoolean(isBlacklisted) || "true".equals(isBlacklisted)) {
                        log.warn("Blocked request from blacklisted user: {}", userId);
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }
                    return chain.filter(exchange);
                });
    }

    @Override
    public int getOrder() {
        return -90;
    }
}
