package com.chintan.gateway.service;

import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.chintan.gateway.model.User;
import com.chintan.gateway.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
public class CustomUserDetailsService implements ReactiveUserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public CustomUserDetailsService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Mono<UserDetails> findByUsername(String username) {
        return userRepository.findByUsername(username)
            .cast(UserDetails.class);
    }

    public Mono<User> registerNewUser(User user) {
        // 1. Create a new User record with the ENCODED password
        User encodedUser = new User(
            null, // Let Postgres handle the auto-increment ID
            user.username(), 
            passwordEncoder.encode(user.password()), 
            "ROLE_USER" // Assign a default role
        );

        // 2. Save it to Postgres via the repository
        return userRepository.save(encodedUser);
    }
}
