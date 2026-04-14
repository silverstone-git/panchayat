package com.chintan.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
            // 1. Disable CSRF for testing (otherwise POST requests will fail)
            .csrf(csrf -> csrf.disable()) 
            
            .authorizeExchange(exchanges -> exchanges
                // 2. Allow anyone to reach the signup and login paths
                .pathMatchers("/auth/signup", "/login").permitAll() 
                
                // 3. Everything else requires a logged-in user
                .anyExchange().authenticated()
            )
            
            // 4. Use the default login form
            .formLogin(Customizer.withDefaults()) 
            .build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
     return new BCryptPasswordEncoder();
    }
}



