package com.subsave;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import static com.subsave.ApiRequests.text;
import static com.subsave.ApiRequests.trim;

record AccountDetails(String name, String email, String password) {
    private static final Pattern EMAIL = Pattern.compile(
        "[^\\p{Zs}\\t\\n\\r\\f\\x0B\\u2028\\u2029\\uFEFF@]+@" +
            "[^\\p{Zs}\\t\\n\\r\\f\\x0B\\u2028\\u2029\\uFEFF@]+\\." +
            "[^\\p{Zs}\\t\\n\\r\\f\\x0B\\u2028\\u2029\\uFEFF@]+"
    );

    static AccountDetails forProfile(Map<String, Object> data, boolean requirePassword) {
        Map<String, String> fields = new LinkedHashMap<>();
        String name = trim(text(data, "name"));
        String password = text(data, "password");
        if (name.isEmpty() || name.length() > 80) {
            fields.put("name", "Enter a name between 1 and 80 characters.");
        }
        String email = validateEmail(text(data, "email"), fields);
        if (requirePassword && (password.length() < 8 || password.length() > 128 || trim(password).isEmpty())) {
            fields.put("password", "Use a password between 8 and 128 characters.");
        }
        requireValid(fields);
        return new AccountDetails(name, email, password);
    }

    static AccountDetails forLogin(Map<String, Object> data) {
        Map<String, String> fields = new LinkedHashMap<>();
        String email = validateEmail(text(data, "email"), fields);
        String password = text(data, "password");
        if (!validLoginPassword(password)) fields.put("password", "Enter your password.");
        requireValid(fields);
        return new AccountDetails("", email, password);
    }

    private static String validateEmail(String rawEmail, Map<String, String> fields) {
        String email = trim(rawEmail).toLowerCase(Locale.ROOT);
        if (rawEmail.length() > 254 || email.length() > 254 || !EMAIL.matcher(email).matches()) {
            fields.put("email", "Enter a valid email address.");
        }
        return email;
    }

    private static void requireValid(Map<String, String> fields) {
        if (!fields.isEmpty()) {
            throw new ApiError(400, "Please check the highlighted fields.", fields);
        }
    }

    static boolean validLoginPassword(String password) {
        return !password.isEmpty() && password.length() <= 128;
    }
}
