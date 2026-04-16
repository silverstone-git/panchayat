package com.chintan.gateway.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import com.chintan.gateway.model.Idea;

import reactor.core.publisher.Flux;

public interface IdeaRepository extends ReactiveCrudRepository<Idea, Long> {
	Flux<Idea> findAllBy(Pageable pageable);
}