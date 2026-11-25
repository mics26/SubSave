package com.subsave;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class SubscriptionStore {
    private static final Pattern UUID_TEXT = Pattern.compile("[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}");
    private final JdbcClient jdbc;

    SubscriptionStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    record Subscription(String id, String ownerId, String name, String category, BigDecimal cost,
                        String billingCycle, String nextRenewal, String iconPreset, String icon) {
        Subscription(String id, String ownerId, SubscriptionDetails details) {
            this(id, ownerId, details.name(), details.category(), details.cost(), details.billingCycle(),
                details.nextRenewal(), details.iconPreset(), details.icon());
        }
    }

    List<Subscription> list(String ownerId) {
        return jdbc.sql("""
            SELECT BIN_TO_UUID(id) AS id, name, category, cost, billing_cycle, next_renewal, icon_preset, icon
            FROM subscriptions
            WHERE owner_id = UUID_TO_BIN(:ownerId)
            ORDER BY next_renewal, id
            """)
            .param("ownerId", ownerId)
            .query((row, number) -> new Subscription(row.getString("id"), ownerId, row.getString("name"),
                row.getString("category"), row.getBigDecimal("cost"), row.getString("billing_cycle"),
                row.getString("next_renewal"), row.getString("icon_preset"), row.getString("icon")))
            .list();
    }

    Subscription add(String ownerId, SubscriptionDetails details) {
        String id = UUID.randomUUID().toString();
        var insert = jdbc.sql("""
            INSERT INTO subscriptions (id, owner_id, name, category, cost, billing_cycle, next_renewal, icon_preset, icon)
            VALUES (UUID_TO_BIN(:id), UUID_TO_BIN(:ownerId), :name, :category, :cost, :billingCycle, :nextRenewal, :iconPreset, :icon)
            """);
        bindDetails(insert, details).param("id", id).param("ownerId", ownerId).update();
        return new Subscription(id, ownerId, details);
    }

    Subscription edit(String ownerId, String subscriptionId, SubscriptionDetails details) {
        String id = normalizeId(subscriptionId);
        var update = jdbc.sql("""
            UPDATE subscriptions
            SET name = :name, category = :category, cost = :cost, billing_cycle = :billingCycle,
                next_renewal = :nextRenewal, icon_preset = :iconPreset, icon = :icon
            WHERE owner_id = UUID_TO_BIN(:ownerId) AND id = UUID_TO_BIN(:id)
            """);
        // Connector/J reports matched rows by default, including a save with identical values.
        requireMatch(bindDetails(update, details).param("id", id).param("ownerId", ownerId).update());
        return new Subscription(id, ownerId, details);
    }

    void delete(String ownerId, String subscriptionId) {
        requireMatch(jdbc.sql("DELETE FROM subscriptions WHERE owner_id = UUID_TO_BIN(:ownerId) AND id = UUID_TO_BIN(:id)")
            .param("id", normalizeId(subscriptionId)).param("ownerId", ownerId).update());
    }

    private static JdbcClient.StatementSpec bindDetails(JdbcClient.StatementSpec statement, SubscriptionDetails details) {
        return statement.param("name", details.name()).param("category", details.category())
            .param("cost", details.cost()).param("billingCycle", details.billingCycle())
            .param("nextRenewal", details.nextRenewal()).param("iconPreset", details.iconPreset())
            .param("icon", details.icon(), Types.LONGVARCHAR);
    }

    private static String normalizeId(String id) {
        if (!UUID_TEXT.matcher(id).matches()) throw new ApiError("Subscription ID must be a UUID.");
        return id.toLowerCase(Locale.ROOT);
    }

    private static void requireMatch(int count) {
        if (count != 1) throw new ApiError(404, "Subscription not found.");
    }
}
