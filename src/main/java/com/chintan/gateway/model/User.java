package com.chintan.gateway.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.relational.core.mapping.Table;

@Table("users")
public record User(@Id @ReadOnlyProperty Long id, String username, String password, String role) {}
