package com.subsave;

import java.util.Map;
import java.util.regex.Pattern;

final class RequestFields {
    private static final Pattern OUTER_WHITESPACE = Pattern.compile(
        "^[\\p{Zs}\\t\\n\\r\\f\\x0B\\u2028\\u2029\\uFEFF]+|[\\p{Zs}\\t\\n\\r\\f\\x0B\\u2028\\u2029\\uFEFF]+$"
    );

    private RequestFields() {}

    static String text(Map<String, Object> data, String field) {
        return data.get(field) instanceof String value ? value : "";
    }

    // Match JavaScript trim, including its treatment of non-breaking spaces.
    static String trim(String value) {
        return OUTER_WHITESPACE.matcher(value).replaceAll("");
    }
}
