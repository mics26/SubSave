package com.subsave;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class ApiErrorHandler {
    @ExceptionHandler(ApiError.class)
    ResponseEntity<Map<String, Object>> handle(ApiError error) {
        return ResponseEntity.status(error.status)
            .body(Map.of("message", error.getMessage(), "fields", error.fields));
    }
}
