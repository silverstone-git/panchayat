package com.chintan.gateway.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.relational.core.mapping.Table;

@Table("ideas")
public record Idea(@Id @ReadOnlyProperty Long id, String title, String content, Long ideatorId) {}

