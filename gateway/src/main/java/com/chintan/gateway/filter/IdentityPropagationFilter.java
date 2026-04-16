package com.chintan.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import com.chintan.gateway.model.User;

import reactor.core.publisher.Mono;

@Component
public class IdentityPropagationFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
            .map(SecurityContext::getAuthentication)
            .filter(auth -> auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User)
            .map(auth -> (User) auth.getPrincipal())
            .flatMap(user -> {
                ServerHttpRequest request = exchange.getRequest().mutate()
                    .header("X-User-Id", String.valueOf(user.id()))
                    .header("X-User-Name", user.username())
                    .build();
                return chain.filter(exchange.mutate().request(request).build());
            })
            .switchIfEmpty(chain.filter(exchange));
    }

    @Override
    public int getOrder() {
        // High order value to ensure it runs after authentication filters
        return 0;
    }
}
