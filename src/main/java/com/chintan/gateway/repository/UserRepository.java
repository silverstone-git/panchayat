package com.chintan.gateway.repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import com.chintan.gateway.model.User;

import reactor.core.publisher.Mono;

public interface UserRepository extends ReactiveCrudRepository<User, Long> {
	Mono<User> findByUsername(String username);
}
