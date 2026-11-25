import { requestJson } from '../api/requestJson.js';

async function requestAccount(path, method = 'GET', data) {
  const result = await requestJson('/api/auth/' + path, { method, data, service: 'account' });
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
