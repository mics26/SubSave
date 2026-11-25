import { requestJson } from '../api/requestJson.js';

function request(accountId, id, method, data) {
  const path = id ? '/api/subscriptions/' + encodeURIComponent(id) : '/api/subscriptions';
  return requestJson(path, {
    method, data, service: 'subscription', headers: { 'X-SubSave-Account': accountId },
  });
}

export const serverSubscriptionService = {
  async list(accountId) {
    const { subscriptions } = await request(accountId, null, 'GET');
    return subscriptions;
  },
  async add(accountId, input) {
    const { subscription } = await request(accountId, null, 'POST', input);
    return subscription;
  },
  async edit(accountId, id, input) {
    const { subscription } = await request(accountId, id, 'PUT', input);
    return subscription;
  },
  delete: (accountId, id) => request(accountId, id, 'DELETE'),
};
