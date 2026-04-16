package com.chintan.gateway.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.chintan.gateway.model.Idea;
import com.chintan.gateway.repository.IdeaRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class IdeaService {
	private final IdeaRepository ideaRepo;
	
	public IdeaService(IdeaRepository ideaRepo) {
		this.ideaRepo = ideaRepo;
	}
	
	public Flux<Idea> getAllIdeas(int page) {
		return this.ideaRepo.findAllBy(PageRequest.of(page, 10));
	}
	
	public Mono<Idea> saveIdea(Idea idea) {
		return this.ideaRepo.save(idea);
	}
}
