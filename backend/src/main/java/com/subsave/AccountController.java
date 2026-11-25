package com.subsave;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

@RestController
@RequestMapping("/api/auth")
class AccountController {
    static final String SESSION_COOKIE = "subsave_session";
    private final AccountStore accounts;
    private final boolean secureCookies;

    AccountController(AccountStore accounts, @Value("${subsave.cookie-secure}") boolean secureCookies) {
        this.accounts = accounts;
        this.secureCookies = secureCookies;
    }

    record SessionResponse(AccountStore.User user) {}

    @GetMapping("/session")
    SessionResponse session(@CookieValue(name = SESSION_COOKIE, required = false) String token) {
        return new SessionResponse(accounts.currentAccount(token));
    }

    @PostMapping(path = "/register", consumes = APPLICATION_JSON_VALUE)
    ResponseEntity<SessionResponse> register(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                                             @RequestBody Map<String, Object> input) {
        var session = accounts.register(input, token);
        return ResponseEntity.status(201).header(HttpHeaders.SET_COOKIE, cookie(session.token()))
            .body(new SessionResponse(session.user()));
    }

    @PostMapping(path = "/login", consumes = APPLICATION_JSON_VALUE)
    ResponseEntity<SessionResponse> login(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                                          @RequestBody Map<String, Object> input) {
        var session = accounts.login(input, token);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie(session.token()))
            .body(new SessionResponse(session.user()));
    }

    @PostMapping(path = "/logout", consumes = APPLICATION_JSON_VALUE)
    ResponseEntity<SessionResponse> logout(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                                           @RequestBody Map<String, Object> input) {
        accounts.logout(token);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie(null)).body(new SessionResponse(null));
    }

    @PatchMapping(path = "/account", consumes = APPLICATION_JSON_VALUE)
    ResponseEntity<SessionResponse> update(@CookieValue(name = SESSION_COOKIE, required = false) String token,
                                           @RequestBody Map<String, Object> input) {
        var session = accounts.updateAccount(token, input);
        var response = ResponseEntity.ok();
        if (session.token() != null) response.header(HttpHeaders.SET_COOKIE, cookie(session.token()));
        return response.body(new SessionResponse(session.user()));
    }

    @ExceptionHandler(DuplicateKeyException.class)
    ResponseEntity<Map<String, Object>> duplicateEmail() {
        return ResponseEntity.status(409).body(Map.of(
            "message", "An account already uses this email.",
            "fields", Map.of("email", "This email is already registered.")
        ));
    }

    private String cookie(String token) {
        return ResponseCookie.from(SESSION_COOKIE, token == null ? "" : token).path("/api")
            .httpOnly(true).sameSite("Lax").secure(secureCookies)
            .maxAge(token == null ? 0 : AccountStore.SESSION_MAX_AGE).build().toString();
    }
}
