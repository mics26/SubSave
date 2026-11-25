import { AccountError } from './accountFields.js';

async function requestAccount(path, method = 'GET', data) {
  const options = { method, credentials: 'same-origin' };
  if (data !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }
  let response;
  let result;
  try {
    response = await fetch('/api/auth/' + path, options);
    result = await response.json();
  } catch {
    throw new AccountError('Could not reach the account service. Please try again.');
  }
  if (!response.ok) {
    throw new AccountError(result.message || 'The account service is unavailable.', result.fields, response.status);
  }
  return result.user;
}

export const serverAccountService = {
  currentAccount: () => requestAccount('session'),
  register: ({ name, email, password }) => requestAccount('register', 'POST', { name, email, password }),
  login: ({ email, password }) => requestAccount('login', 'POST', { email, password }),
  logout: () => requestAccount('logout', 'POST', {}),
  updateAccount: (accountId, { name, email, currentPassword, password }) =>
    requestAccount('account', 'PATCH', { accountId, name, email, currentPassword, password }),
};
