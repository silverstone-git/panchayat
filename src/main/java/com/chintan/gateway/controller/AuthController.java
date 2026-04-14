package com.chintan.gateway.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chintan.gateway.model.User;
import com.chintan.gateway.service.CustomUserDetailsService;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final CustomUserDetailsService userService;

    public AuthController(CustomUserDetailsService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public Mono<User> signup(@RequestBody User user) {
        return userService.registerNewUser(user);
    }
};