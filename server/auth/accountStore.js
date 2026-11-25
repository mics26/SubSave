import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import {
  AccountError, normalizeEmail, publicAccount, validateDetails, validateLogin,
} from '../../src/accounts/accountFields.js';

export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const deriveKey = promisify(scrypt);
const SCRYPT_OPTIONS = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const DUMMY_SALT = randomBytes(16);
const CREDENTIAL_FIELDS = 'BIN_TO_UUID(c.account_id) AS id, c.display_name AS name, c.email, c.password_salt AS salt, c.password_hash AS passwordHash';

const hashPassword = (password, salt) => deriveKey(password, salt, 64, SCRYPT_OPTIONS);
const hashToken = (token) => createHash('sha256').update(token).digest();
const invalidLogin = () => new AccountError('Email or password is incorrect. Please try again.', {}, 401);

async function passwordCredentials(password) {
  const salt = randomBytes(16);
  return { salt, passwordHash: await hashPassword(password, salt) };
}

async function withTransaction(database, perform) {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const result = await perform(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AccountError('An account already uses this email.', { email: 'This email is already registered.' }, 409);
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function removeSession(database, token) {
  if (token) await database.execute('DELETE FROM account_sessions WHERE token_hash = ?', [hashToken(token)]);
}

async function startSession(database, id, previousToken) {
  const token = randomBytes(32).toString('base64url');
  await database.execute(`
    INSERT INTO account_sessions (token_hash, account_id, expires_at)
    VALUES (?, UUID_TO_BIN(?), TIMESTAMPADD(SECOND, ?, UTC_TIMESTAMP(3)))
  `, [hashToken(token), id, SESSION_MAX_AGE]);
  await removeSession(database, previousToken);
  return token;
}

async function sessionAccount(database, token, lock = false) {
  if (!token) return null;
  const [rows] = await database.execute(`
    SELECT ${CREDENTIAL_FIELDS} FROM account_sessions s
    JOIN account_credentials c ON c.account_id = s.account_id
    WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP(3)${lock ? ' FOR UPDATE' : ''}
  `, [hashToken(token)]);
  return rows[0] ?? null;
}

async function emailAccount(database, email, lock = false) {
  const [rows] = await database.execute(`
    SELECT ${CREDENTIAL_FIELDS} FROM account_credentials c WHERE c.email = ?${lock ? ' FOR UPDATE' : ''}
  `, [email]);
  return rows[0];
}

export function createAccountStore(database) {
  return {
    async currentAccount(token) {
      const account = await sessionAccount(database, token);
      return account ? publicAccount(account) : null;
    },

    async register(input, previousToken) {
      validateDetails(input);
      const user = { id: randomUUID(), name: input.name.trim(), email: normalizeEmail(input.email) };
      const { salt, passwordHash } = await passwordCredentials(input.password);
      return withTransaction(database, async (connection) => {
        await connection.execute('INSERT INTO accounts (id) VALUES (UUID_TO_BIN(?))', [user.id]);
        await connection.execute(`
          INSERT INTO account_credentials (account_id, display_name, email, password_salt, password_hash)
          VALUES (UUID_TO_BIN(?), ?, ?, ?, ?)
        `, [user.id, user.name, user.email, salt, passwordHash]);
        const token = await startSession(connection, user.id, previousToken);
        return { user, token };
      });
    },

    async login(input, previousToken) {
      validateLogin(input);
      const email = normalizeEmail(input.email);
      const account = await emailAccount(database, email);
      const hash = await hashPassword(input.password, account?.salt ?? DUMMY_SALT);
      if (!account || !timingSafeEqual(hash, account.passwordHash)) throw invalidLogin();

      return withTransaction(database, async (connection) => {
        const current = await emailAccount(connection, email, true);
        if (current?.id !== account.id || !timingSafeEqual(hash, current.passwordHash)) throw invalidLogin();
        const token = await startSession(connection, current.id, previousToken);
        return { user: publicAccount(current), token };
      });
    },

    logout(token) {
      return removeSession(database, token);
    },

    async updateAccount(token, input) {
      const { password, currentPassword, accountId } = input;
      const changePassword = password !== undefined && password !== '';
      validateDetails(input, changePassword);
      const name = input.name.trim();
      const email = normalizeEmail(input.email);
      return withTransaction(database, async (connection) => {
        const account = await sessionAccount(connection, token, true);
        if (!account || account.id !== accountId) {
          throw new AccountError('Your session changed. Log in again to continue.', {}, 401);
        }

        const changeCredentials = changePassword || email !== account.email;
        if (changeCredentials && (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > 128 ||
          !timingSafeEqual(await hashPassword(currentPassword, account.salt), account.passwordHash))) {
          throw new AccountError('Confirm your current password to change your email or password.', {
            currentPassword: 'Enter your correct current password.',
          });
        }

        const { salt, passwordHash } = changePassword ? await passwordCredentials(password) : account;
        await connection.execute(`
          UPDATE account_credentials SET display_name = ?, email = ?, password_salt = ?, password_hash = ?
          WHERE account_id = UUID_TO_BIN(?)
        `, [name, email, salt, passwordHash, account.id]);
        const user = { id: account.id, name, email };
        if (!changeCredentials) return { user };
        await connection.execute('DELETE FROM account_sessions WHERE account_id = UUID_TO_BIN(?)', [account.id]);
        return { user, token: await startSession(connection, account.id) };
      });
    },
  };
}
