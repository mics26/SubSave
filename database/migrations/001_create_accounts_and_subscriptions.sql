CREATE TABLE IF NOT EXISTS accounts (
  id BINARY(16) NOT NULL,
  PRIMARY KEY (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BINARY(16) NOT NULL,
  owner_id BINARY(16) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  cost DECIMAL(12, 2) NOT NULL,
  billing_cycle VARCHAR(7) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  next_renewal DATE NOT NULL,
  icon_preset VARCHAR(10) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'auto',
  icon MEDIUMTEXT CHARACTER SET ascii COLLATE ascii_bin NULL,
  PRIMARY KEY (id),
  KEY subscriptions_owner_renewal (owner_id, next_renewal, id),
  CONSTRAINT subscriptions_owner_fk FOREIGN KEY (owner_id) REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_name_check CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT subscriptions_category_check CHECK (
    category IN ('Entertainment', 'Music & Audio', 'Developer Tools', 'Cloud Storage', 'Productivity', 'General')
  ),
  CONSTRAINT subscriptions_cost_check CHECK (cost > 0),
  CONSTRAINT subscriptions_billing_cycle_check CHECK (billing_cycle IN ('Monthly', 'Yearly')),
  CONSTRAINT subscriptions_renewal_check CHECK (next_renewal >= '1000-01-01'),
  CONSTRAINT subscriptions_icon_check CHECK (
    (icon_preset IN ('auto', 'none', 'spotify', 'netflix', 'github', 'google-one') AND icon IS NULL)
    OR (
      icon_preset = 'custom' AND icon IS NOT NULL AND OCTET_LENGTH(icon) <= 1398127
      AND (icon LIKE 'data:image/png;base64,%' OR icon LIKE 'data:image/jpeg;base64,%')
    )
  )
) ENGINE = InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
