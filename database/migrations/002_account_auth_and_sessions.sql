CREATE TABLE IF NOT EXISTS account_credentials (
  account_id BINARY(16) NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) COLLATE utf8mb4_0900_as_cs NOT NULL,
  password_salt BINARY(16) NOT NULL,
  password_hash BINARY(64) NOT NULL,
  PRIMARY KEY (account_id),
  UNIQUE KEY account_credentials_email (email),
  CONSTRAINT account_credentials_account_fk FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash BINARY(32) NOT NULL,
  account_id BINARY(16) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  PRIMARY KEY (token_hash),
  KEY account_sessions_account (account_id),
  KEY account_sessions_expiry (expires_at),
  CONSTRAINT account_sessions_account_fk FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
) ENGINE = InnoDB;
