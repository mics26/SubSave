package com.subsave;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static com.subsave.RequestFields.text;
import static com.subsave.RequestFields.trim;

record SubscriptionDetails(String name, String category, BigDecimal cost, String billingCycle,
                           String nextRenewal, String iconPreset, String icon) {
    static final int MAX_ICON_BYTES = 1024 * 1024;
    private static final BigDecimal MAX_COST = new BigDecimal("9999999999.99");
    private static final Pattern DATE = Pattern.compile("[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}");
    private static final Set<String> CATEGORIES = Set.of(
        "Entertainment", "Music & Audio", "Developer Tools", "Cloud Storage", "Productivity", "General"
    );
    private static final Set<String> BILLING_CYCLES = Set.of("Monthly", "Yearly");
    private static final Set<String> ICON_PRESETS = Set.of("auto", "none", "spotify", "netflix", "github", "google-one");

    static SubscriptionDetails read(Map<String, Object> data) {
        if (data.containsKey("id") || data.containsKey("ownerId")) {
            throw new ApiError("The subscription ID and owner cannot be set in the subscription details.");
        }

        String name = trim(text(data, "name"));
        if (name.isEmpty() || name.codePointCount(0, name.length()) > 120) {
            throw new ApiError("Subscription name must be 1–120 characters.");
        }
        String category = text(data, "category");
        if (!CATEGORIES.contains(category)) throw new ApiError("Choose a supported category.");
        BigDecimal cost = readCost(data.get("cost"));
        String billingCycle = text(data, "billingCycle");
        if (!BILLING_CYCLES.contains(billingCycle)) throw new ApiError("Choose a supported billing cycle.");
        String nextRenewal = readRenewal(text(data, "nextRenewal"));

        String iconPreset = data.containsKey("iconPreset") ? text(data, "iconPreset") : "auto";
        Object icon = data.get("icon");
        if (iconPreset.equals("custom")) {
            if (!(icon instanceof String url) || !validIcon(url)) {
                throw new ApiError("Custom icons must be PNG or JPEG data URLs up to 1 MiB.");
            }
        } else if (!ICON_PRESETS.contains(iconPreset) || icon != null) {
            throw new ApiError("Choose a supported icon preset or a custom icon.");
        }
        return new SubscriptionDetails(name, category, cost, billingCycle, nextRenewal, iconPreset, (String) icon);
    }

    private static BigDecimal readCost(Object input) {
        if (input instanceof Number number && Double.isFinite(number.doubleValue())) {
            BigDecimal cost = BigDecimal.valueOf(number.doubleValue()).stripTrailingZeros();
            if (cost.signum() > 0 && cost.scale() <= 2 && cost.compareTo(MAX_COST) <= 0) {
                return cost.setScale(2);
            }
        }
        throw new ApiError("PHP cost must be between 0.01 and 9,999,999,999.99 with up to two decimal places.");
    }

    private static String readRenewal(String date) {
        try {
            if (DATE.matcher(date).matches()) return LocalDate.parse(date).toString();
        } catch (DateTimeParseException ignored) {
            // The same message covers invalid calendar dates and incorrect formats.
        }
        throw new ApiError("Renewal date must be a valid YYYY-MM-DD date.");
    }

    private static boolean validIcon(String url) {
        if (!url.startsWith("data:image/png;base64,") && !url.startsWith("data:image/jpeg;base64,")) return false;
        String payload = url.substring(url.indexOf(',') + 1);
        int maxLength = ((MAX_ICON_BYTES + 2) / 3) * 4;
        if (payload.isEmpty() || payload.length() > maxLength || payload.length() % 4 != 0) return false;
        try {
            return Base64.getDecoder().decode(payload).length <= MAX_ICON_BYTES;
        } catch (IllegalArgumentException error) {
            return false;
        }
    }
}
