package com.subsave;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootApplication
public class SubSaveApplication {
    public static void main(String[] args) {
        SpringApplication.run(SubSaveApplication.class, args);
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
