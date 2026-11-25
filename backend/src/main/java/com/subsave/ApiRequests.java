package com.subsave;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.net.URI;
import java.util.Map;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.LoggerFactory;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataAccessException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.transaction.TransactionException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
class ApiRequests extends RequestBodyAdviceAdapter implements WebMvcConfigurer {
    private static final Pattern OUTER_WHITESPACE = Pattern.compile(
        "^[\\p{Zs}\\t\\n\\r\\f\\x0B\\u2028\\u2029\\uFEFF]+|[\\p{Zs}\\t\\n\\r\\f\\x0B\\u2028\\u2029\\uFEFF]+$"
    );

    static String text(Map<String, Object> data, String field) {
        return data.get(field) instanceof String value ? value : "";
    }

    // Match JavaScript trim, including its treatment of non-breaking spaces.
    static String trim(String value) {
        return OUTER_WHITESPACE.matcher(value).replaceAll("");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
                String origin = request.getHeader(HttpHeaders.ORIGIN);
                if (origin != null && !request.getMethod().equals("GET") && !request.getMethod().equals("HEAD")) {
                    verifyOrigin(origin, request.getHeader(HttpHeaders.HOST));
                }
                return true;
            }
        }).addPathPatterns("/api/**");
    }

    private static void verifyOrigin(String origin, String host) {
        try {
            var uri = URI.create(origin);
            if (("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                && uri.getHost() != null && uri.getUserInfo() == null
                && uri.getRawPath().isEmpty() && uri.getRawQuery() == null && uri.getRawFragment() == null
                && uri.getRawAuthority().equalsIgnoreCase(host)) {
                return;
            }
        } catch (IllegalArgumentException ignored) {
            // Invalid origins receive the same response as other rejected origins.
        }
        throw new ApiError(403, "Request origin is not allowed.");
    }

    @Override
    public boolean supports(MethodParameter parameter, Type type, Class<? extends HttpMessageConverter<?>> converter) {
        return parameter.getContainingClass() == AccountController.class
            || parameter.getContainingClass() == SubscriptionController.class;
    }

    @Override
    public HttpInputMessage beforeBodyRead(HttpInputMessage input, MethodParameter parameter, Type type,
                                        Class<? extends HttpMessageConverter<?>> converter) throws IOException {
        int limit = 4096;
        if (parameter.getContainingClass() == SubscriptionController.class) {
            limit += ((SubscriptionDetails.MAX_ICON_BYTES + 2) / 3) * 4;
        }
        byte[] bytes = input.getBody().readNBytes(limit + 1);
        if (bytes.length > limit) {
            throw new ApiError(413, "The request is too large.");
        }
        return new HttpInputMessage() {
            @Override
            public InputStream getBody() {
                return new ByteArrayInputStream(bytes);
            }

            @Override
            public HttpHeaders getHeaders() {
                return input.getHeaders();
            }
        };
    }

    @ExceptionHandler(ApiError.class)
    ResponseEntity<Map<String, Object>> apiError(ApiError error) {
        return ResponseEntity.status(error.status).cacheControl(CacheControl.noStore())
            .body(Map.of("message", error.getMessage(), "fields", error.fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> invalidJson() {
        return apiError(new ApiError("Send a valid JSON object."));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<Map<String, Object>> unsupportedType() {
        return apiError(new ApiError(415, "Send the request as JSON."));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<Map<String, Object>> unsupportedMethod(HttpServletRequest request) {
        if (request.getRequestURI().startsWith("/api/subscriptions")) {
            return apiError(new ApiError(405, "Method not allowed."));
        }
        return routeNotFound();
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<Map<String, Object>> routeNotFound() {
        return apiError(new ApiError(404, "Route not found."));
    }

    @ExceptionHandler({DataAccessException.class, TransactionException.class})
    ResponseEntity<Map<String, Object>> databaseError(RuntimeException error, HttpServletRequest request) {
        LoggerFactory.getLogger(ApiRequests.class).error("SubSave database error: {}", error.getClass().getSimpleName());
        String service = request.getRequestURI().startsWith("/api/subscriptions") ? "subscription" : "account";
        return apiError(new ApiError(503, "The " + service + " service is unavailable. Please try again."));
    }
}
