package com.subsave;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.WebContentInterceptor;
import tools.jackson.core.StreamReadConstraints;

@SpringBootApplication
public class SubSaveApplication implements WebMvcConfigurer {
    public static void main(String[] args) {
        // Allow room for a 1 MiB icon after Base64 encoding.
        StreamReadConstraints.overrideDefaultStreamReadConstraints(
            StreamReadConstraints.builder().maxDocumentLength(2 * 1024 * 1024).build());
        SpringApplication.run(SubSaveApplication.class, args);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Vite proxies the API, so the browser uses the same origin for both.
        registry.addMapping("/api/**").allowedOrigins();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        var noCache = new WebContentInterceptor();
        noCache.setCacheSeconds(0);
        registry.addInterceptor(noCache).addPathPatterns("/api/**");
    }

    @Bean
    ApplicationRunner checkDatabase(JdbcClient jdbc) {
        return args -> {
            jdbc.sql("SELECT id FROM accounts LIMIT 0").query(String.class).list();
            jdbc.sql("SELECT account_id FROM account_credentials LIMIT 0").query(String.class).list();
            jdbc.sql("SELECT token_hash FROM account_sessions LIMIT 0").query(String.class).list();
            jdbc.sql("SELECT id FROM subscriptions LIMIT 0").query(String.class).list();
        };
    }
}
