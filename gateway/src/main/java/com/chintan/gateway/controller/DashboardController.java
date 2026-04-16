package com.chintan.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.chintan.gateway.model.Idea;
import com.chintan.gateway.service.IdeaService;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
public class DashboardController {
	
	private final IdeaService ideaService;
	
	public DashboardController(IdeaService ideaService) {
		this.ideaService = ideaService;
	}
	
	@GetMapping("/")
    public Mono<String> hemlo() {
        return Mono.just("Hi mom");
    }
	
	@GetMapping("/ideas")
    public Flux<Idea> getIdeas(@RequestParam(defaultValue = "0") int page) {
        return this.ideaService.getAllIdeas(page);
    }
	
	@PostMapping("/idea")
    public Mono<Idea> createIdea(@RequestBody Idea idea) {
        return this.ideaService.saveIdea(idea);
    }
}
