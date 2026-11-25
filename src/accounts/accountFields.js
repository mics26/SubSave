export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AccountError extends Error {
  constructor(message, fields = {}, status = 400) {
    super(message);
    this.name = 'AccountError';
    this.fields = fields;
    this.status = status;
  }
}

export const normalizeEmail = (email) => email.trim().toLowerCase();
export const publicAccount = ({ id, name, email }) => ({ id, name, email });

function validEmail(email) {
  if (typeof email !== 'string' || email.length > 254) return false;
  const normalized = normalizeEmail(email);
  return normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
}

export function validateDetails({ name, email, password }, requirePassword = true) {
  const fields = {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    fields.name = 'Enter a name between 1 and 80 characters.';
  }
  if (!validEmail(email)) fields.email = 'Enter a valid email address.';
  if (requirePassword && (typeof password !== 'string' || password.length < 8 || password.length > 128 || !password.trim())) {
    fields.password = 'Use a password between 8 and 128 characters.';
  }
  if (Object.keys(fields).length) throw new AccountError('Please check the highlighted fields.', fields);
}

export function validateLogin({ email, password }) {
  const fields = {};
  if (!validEmail(email)) fields.email = 'Enter a valid email address.';
  if (typeof password !== 'string' || !password || password.length > 128) fields.password = 'Enter your password.';
  if (Object.keys(fields).length) throw new AccountError('Please check the highlighted fields.', fields);
}
