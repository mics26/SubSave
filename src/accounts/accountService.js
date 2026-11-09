export const ACCOUNT_STORAGE_KEY = 'subsave.accounts.v1';
const ITERATIONS = 100_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AccountError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'AccountError';
    this.fields = fields;
  }
}

function validateDetails({ name, email, password }, requirePassword = true) {
  const fields = {};
  if (!name?.trim() || name.trim().length > 80) {
    fields.name = 'Enter a name between 1 and 80 characters.';
  }
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
    fields.email = 'Enter a valid email address.';
  }
  if (requirePassword && (!password || password.length < 8 || password.length > 128 || !password.trim())) {
    fields.password = 'Use a password between 8 and 128 characters.';
  }
  if (Object.keys(fields).length) {
    throw new AccountError('Please check the highlighted fields.', fields);
  }
}

const normalizeEmail = (email) => email.trim().toLowerCase();
const publicAccount = ({ id, name, email }) => ({ id, name, email });
const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bytes = Uint8Array.from(salt.match(/.{2}/g), (pair) => Number.parseInt(pair, 16));
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bytes, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256,
  );
  return toHex(new Uint8Array(hash));
}

async function credentials(password) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, passwordHash: await hashPassword(password, salt) };
}

// One local-storage record makes account and session changes a single write.
// This is a demo identity store, not a replacement for server authentication.
export function createAccountService(getStorage = () => window.localStorage) {
  let recovery = null;

  function read() {
    let raw;
    try {
      raw = getStorage().getItem(ACCOUNT_STORAGE_KEY);
    } catch {
      throw new AccountError('Browser storage is unavailable. Allow local storage, then try again.');
    }
    if (raw === null) return { version: 1, accounts: [], sessionUserId: null };
    try {
      const data = JSON.parse(raw);
      if (data?.version !== 1 || !Array.isArray(data.accounts) ||
        !(data.sessionUserId === null || typeof data.sessionUserId === 'string')) throw new Error();
      const ids = new Set();
      const emails = new Set();
      for (const account of data.accounts) {
        if (typeof account?.id !== 'string' || !account.id || ids.has(account.id) ||
          typeof account.name !== 'string' || !account.name.trim() || account.name.length > 80 ||
          typeof account.email !== 'string' || !EMAIL_PATTERN.test(account.email) ||
          account.email !== normalizeEmail(account.email) || emails.has(account.email) ||
          !/^[a-f0-9]{32}$/.test(account.salt) || !/^[a-f0-9]{64}$/.test(account.passwordHash)) throw new Error();
        ids.add(account.id);
        emails.add(account.email);
      }
      if (data.sessionUserId !== null && !ids.has(data.sessionUserId)) throw new Error();
      return data;
    } catch {
      throw new AccountError('Saved account data could not be read. Remove the subsave.accounts.v1 storage key to start again.');
    }
  }

  function write(data) {
    try {
      getStorage().setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      throw new AccountError('Your changes could not be saved. Check browser storage permissions or space and try again.');
    }
  }

  function currentAccount() {
    const data = read();
    const account = data.accounts.find((item) => item.id === data.sessionUserId);
    return account ? publicAccount(account) : null;
  }

  function requireSession(data, userId) {
    const account = data.accounts.find((item) => item.id === userId);
    if (!account || data.sessionUserId !== userId) {
      throw new AccountError('Your session has changed. Log in again to continue.');
    }
    return account;
  }

  return {
    currentAccount,
    cancelRecovery() { recovery = null; },
    async register({ name, email, password }) {
      validateDetails({ name, email, password });
      const secured = await credentials(password);
      const data = read();
      email = normalizeEmail(email);
      if (data.accounts.some((item) => item.email === email)) {
        throw new AccountError('An account already uses this email. Log in or reset your password.', { email: 'This email is already registered.' });
      }
      const account = { id: crypto.randomUUID(), name: name.trim(), email, ...secured };
      data.accounts.push(account);
      data.sessionUserId = account.id;
      write(data);
      recovery = null;
      return publicAccount(account);
    },
    async login({ email, password }) {
      const fields = {};
      if (!email || !EMAIL_PATTERN.test(email.trim())) fields.email = 'Enter a valid email address.';
      if (!password) fields.password = 'Enter your password.';
      if (Object.keys(fields).length) throw new AccountError('Please check the highlighted fields.', fields);
      const data = read();
      const account = data.accounts.find((item) => item.email === normalizeEmail(email));
      if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
        throw new AccountError('Email or password is incorrect. Please try again.');
      }
      // Re-read after hashing so another tab's account changes are not overwritten.
      const latest = read();
      const saved = latest.accounts.find((item) => item.id === account.id);
      if (!saved || saved.passwordHash !== account.passwordHash || saved.email !== account.email) {
        throw new AccountError('Your account changed. Please log in again.');
      }
      latest.sessionUserId = account.id;
      write(latest);
      recovery = null;
      return publicAccount(saved);
    },
    logout() {
      const data = read();
      data.sessionUserId = null;
      write(data);
      recovery = null;
    },
    async updateAccount(userId, { name, email, currentPassword, password }) {
      validateDetails({ name, email, password }, Boolean(password));
      const data = read();
      const account = requireSession(data, userId);
      email = normalizeEmail(email);
      const sensitiveChange = email !== account.email || Boolean(password);
      if (sensitiveChange && (!currentPassword || await hashPassword(currentPassword, account.salt) !== account.passwordHash)) {
        throw new AccountError('Confirm your current password to change your email or password.', { currentPassword: 'Enter your correct current password.' });
      }
      const secured = password ? await credentials(password) : {};
      const latest = read();
      const saved = requireSession(latest, userId);
      if (saved.passwordHash !== account.passwordHash || saved.email !== account.email) {
        throw new AccountError('Your account changed in another tab. Refresh and try again.');
      }
      if (latest.accounts.some((item) => item.id !== userId && item.email === email)) {
        throw new AccountError('An account already uses this email.', { email: 'This email is already registered.' });
      }
      Object.assign(saved, { name: name.trim(), email, ...secured });
      write(latest);
      recovery = null;
      return publicAccount(saved);
    },
    requestReset(email) {
      recovery = null;
      if (!email || !EMAIL_PATTERN.test(email.trim())) {
        throw new AccountError('Enter your account email.', { email: 'Enter a valid email address.' });
      }
      const account = read().accounts.find((item) => item.email === normalizeEmail(email));
      if (!account) throw new AccountError('No account was found for this email.', { email: 'Register an account first or check your email.' });
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
      recovery = { userId: account.id, email: account.email, passwordHash: account.passwordHash, code, expires: Date.now() + 600_000, attempts: 0 };
      return code;
    },
    async resetPassword({ code, password }) {
      validateDetails({ name: 'Recovery', email: 'recovery@example.com', password });
      const challenge = recovery;
      if (!challenge || Date.now() >= challenge.expires) {
        recovery = null;
        throw new AccountError('This recovery code has expired. Request a new code.');
      }
      if (code.trim() !== challenge.code) {
        challenge.attempts += 1;
        if (challenge.attempts >= 5) {
          recovery = null;
          throw new AccountError('Too many incorrect attempts. Request a new recovery code.');
        }
        throw new AccountError('The recovery code is incorrect.', { code: 'Enter the six-digit recovery code.' });
      }
      const secured = await credentials(password);
      if (recovery !== challenge || Date.now() >= challenge.expires) throw new AccountError('Request a new recovery code.');
      const data = read();
      const account = data.accounts.find((item) => item.id === challenge.userId);
      if (!account || account.email !== challenge.email || account.passwordHash !== challenge.passwordHash) {
        recovery = null;
        throw new AccountError('Your account changed. Request a new recovery code.');
      }
      Object.assign(account, secured);
      data.sessionUserId = null;
      write(data);
      recovery = null;
    },
  };
}
