package com.subsave;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.subsave.RequestFields.text;

@Service
class AccountStore {
    static final long SESSION_MAX_AGE = 7 * 24 * 60 * 60;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final byte[] DUMMY_SALT = RANDOM.generateSeed(16);
    private static final Pattern SESSION_TOKEN = Pattern.compile("[A-Za-z0-9_-]{43}");
    private static final String CREDENTIAL_COLUMNS = """
        BIN_TO_UUID(c.account_id) AS id, c.display_name AS name, c.email, c.password_salt, c.password_hash
        """;

    private final JdbcClient jdbc;

    AccountStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    record User(String id, String name, String email) {}
    record SignedIn(User user, String token) {}
    private record Credentials(User user, byte[] salt, byte[] hash) {}

    User currentAccount(String token) {
        if (!validToken(token)) return null;
        return jdbc.sql("""
            SELECT BIN_TO_UUID(c.account_id) AS id, c.display_name AS name, c.email
            FROM account_sessions s
            JOIN account_credentials c ON c.account_id = s.account_id
            WHERE s.token_hash = :hash AND s.expires_at > UTC_TIMESTAMP(3)
            """)
            .param("hash", hashToken(token))
            .query((row, number) -> readUser(row)).optional().orElse(null);
    }

    @Transactional
    public SignedIn register(Map<String, Object> input, String previousToken) {
        var details = AccountDetails.forProfile(input, true);
        var user = new User(UUID.randomUUID().toString(), details.name(), details.email());
        byte[] salt = randomBytes(16);
        byte[] hash = hashPassword(details.password(), salt);

        jdbc.sql("INSERT INTO accounts (id) VALUES (UUID_TO_BIN(:id))").param("id", user.id()).update();
        jdbc.sql("""
            INSERT INTO account_credentials (account_id, display_name, email, password_salt, password_hash)
            VALUES (UUID_TO_BIN(:id), :name, :email, :salt, :hash)
            """)
            .param("id", user.id()).param("name", user.name()).param("email", user.email())
            .param("salt", salt).param("hash", hash).update();
        return new SignedIn(user, startSession(user.id(), previousToken));
    }

    @Transactional
    public SignedIn login(Map<String, Object> input, String previousToken) {
        var details = AccountDetails.forLogin(input);
        // Lock the credential row so password changes and sign-in can't overlap.
        var account = jdbc.sql("SELECT " + CREDENTIAL_COLUMNS + "FROM account_credentials c WHERE c.email = :email FOR UPDATE")
            .param("email", details.email()).query((row, number) -> readCredentials(row)).optional().orElse(null);
        byte[] hash = hashPassword(details.password(), account == null ? DUMMY_SALT : account.salt());
        if (account == null || !MessageDigest.isEqual(hash, account.hash())) throw invalidLogin();
        return new SignedIn(account.user(), startSession(account.user().id(), previousToken));
    }

    void logout(String token) {
        if (validToken(token)) {
            jdbc.sql("DELETE FROM account_sessions WHERE token_hash = :hash").param("hash", hashToken(token)).update();
        }
    }

    @Transactional
    public SignedIn updateAccount(String token, Map<String, Object> input) {
        boolean changePassword = input.containsKey("password") && !"".equals(input.get("password"));
        var details = AccountDetails.forProfile(input, changePassword);
        var account = findSessionForUpdate(token);
        if (account == null || !account.user().id().equals(text(input, "accountId"))) throw ApiError.changedSession();

        boolean changeCredentials = changePassword || !details.email().equals(account.user().email());
        String currentPassword = text(input, "currentPassword");
        if (changeCredentials && (!AccountDetails.validLoginPassword(currentPassword)
            || !MessageDigest.isEqual(hashPassword(currentPassword, account.salt()), account.hash()))) {
            throw new ApiError(400, "Confirm your current password to change your email or password.",
                Map.of("currentPassword", "Enter your correct current password."));
        }

        var user = new User(account.user().id(), details.name(), details.email());
        byte[] salt = changePassword ? randomBytes(16) : account.salt();
        byte[] hash = changePassword ? hashPassword(details.password(), salt) : account.hash();
        jdbc.sql("""
            UPDATE account_credentials SET display_name = :name, email = :email, password_salt = :salt, password_hash = :hash
            WHERE account_id = UUID_TO_BIN(:id)
            """)
            .param("id", user.id()).param("name", user.name()).param("email", user.email())
            .param("salt", salt).param("hash", hash).update();
        if (!changeCredentials) return new SignedIn(user, null);

        jdbc.sql("DELETE FROM account_sessions WHERE account_id = UUID_TO_BIN(:id)").param("id", user.id()).update();
        return new SignedIn(user, startSession(user.id(), null));
    }

    private Credentials findSessionForUpdate(String token) {
        if (!validToken(token)) return null;
        return jdbc.sql("SELECT " + CREDENTIAL_COLUMNS + """
            FROM account_sessions s
            JOIN account_credentials c ON c.account_id = s.account_id
            WHERE s.token_hash = :hash AND s.expires_at > UTC_TIMESTAMP(3)
            FOR UPDATE
            """)
            .param("hash", hashToken(token))
            .query((row, number) -> readCredentials(row)).optional().orElse(null);
    }

    private String startSession(String accountId, String previousToken) {
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes(32));
        jdbc.sql("""
            INSERT INTO account_sessions (token_hash, account_id, expires_at)
            VALUES (:hash, UUID_TO_BIN(:id), TIMESTAMPADD(SECOND, :maxAge, UTC_TIMESTAMP(3)))
            """)
            .param("hash", hashToken(token)).param("id", accountId).param("maxAge", SESSION_MAX_AGE).update();
        logout(previousToken);
        return token;
    }

    private static User readUser(ResultSet row) throws SQLException {
        return new User(row.getString("id"), row.getString("name"), row.getString("email"));
    }

    private static Credentials readCredentials(ResultSet row) throws SQLException {
        return new Credentials(readUser(row), row.getBytes("password_salt"), row.getBytes("password_hash"));
    }

    private static ApiError invalidLogin() {
        return new ApiError(401, "Email or password is incorrect. Please try again.");
    }

    private static boolean validToken(String token) {
        return token != null && SESSION_TOKEN.matcher(token).matches();
    }

    private static byte[] randomBytes(int size) {
        byte[] bytes = new byte[size];
        RANDOM.nextBytes(bytes);
        return bytes;
    }

    // Use the Node backend's scrypt settings so stored passwords continue to work.
    private static byte[] hashPassword(String password, byte[] salt) {
        String normalized = password.replaceAll("\\p{Cs}", "\uFFFD");
        return SCrypt.generate(normalized.getBytes(StandardCharsets.UTF_8), salt, 1 << 15, 8, 3, 64);
    }

    private static byte[] hashToken(String token) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.US_ASCII));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is required by Java", error);
        }
    }
}
