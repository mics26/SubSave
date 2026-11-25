package com.subsave;

import java.util.Map;

final class ApiError extends RuntimeException {
    final int status;
    final Map<String, String> fields;

    ApiError(String message) {
        this(400, message);
    }

    ApiError(int status, String message) {
        this(status, message, Map.of());
    }

    ApiError(int status, String message, Map<String, String> fields) {
        super(message);
        this.status = status;
        this.fields = fields;
    }

    static ApiError changedSession() {
        return new ApiError(401, "Your session changed. Log in again to continue.");
    }
}
