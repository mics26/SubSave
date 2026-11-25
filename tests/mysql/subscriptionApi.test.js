import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { createPool } from 'mysql2/promise';
import { createAppServer } from '../../server/httpServer.js';

const subscriptions = '/api/subscriptions';
const password = 'SubscriptionsSmokeTest-2026!';
const icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGd0AAAAASUVORK5CYII=';

test('authenticated subscription CRUD persists across sessions and isolates accounts', async (t) => {
  const url = process.env.SUBSAVE_MYSQL_TEST_URL;
  assert.ok(url, 'Set SUBSAVE_MYSQL_TEST_URL for a test schema with migrations 001 and 002 applied.');
  const database = createPool(url);
  const server = createAppServer(database).listen(0, '127.0.0.1');
  const createdIds = [];
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    try {
      for (const id of createdIds) await database.execute('DELETE FROM accounts WHERE id = UUID_TO_BIN(?)', [id]);
    } finally {
      await database.end();
    }
  });
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;

  const request = (path, { method = 'GET', account, data, accountId = account?.id } = {}) => fetch(origin + path, {
    method,
    headers: {
      Origin: origin,
      ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(account ? { Cookie: account.cookie } : {}),
      ...(accountId ? { 'X-SubSave-Account': accountId } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  async function register(name) {
    const email = `${randomUUID()}@example.test`;
    const response = await request('/api/auth/register', { method: 'POST', data: { name, email, password } });
    assert.equal(response.status, 201);
    const { user } = await response.json();
    createdIds.push(user.id);
    return { ...user, cookie: response.headers.get('set-cookie').split(';')[0] };
  }
  async function list(account) {
    const response = await request(subscriptions, { account });
    assert.equal(response.status, 200);
    return (await response.json()).subscriptions;
  }

  const first = await register('First test account');
  const second = await register('Second test account');
  assert.equal((await request(subscriptions)).status, 401);
  assert.deepEqual(await list(first), []);
  assert.deepEqual(await list(second), []);

  const data = { name: 'Music plan', cost: 149.50, category: 'Music & Audio', billingCycle: 'Monthly',
    nextRenewal: '2028-02-29', iconPreset: 'custom', icon };
  const add = await request(subscriptions, { method: 'POST', account: first, data });
  assert.equal(add.status, 201);
  const { subscription } = await add.json();
  assert.equal(subscription.ownerId, first.id);
  assert.deepEqual(await list(first), [subscription]);
  assert.deepEqual(await list(second), []);

  const item = `${subscriptions}/${subscription.id}`;
  assert.equal((await request(item, { method: 'PUT', account: second, data })).status, 404);
  assert.equal((await request(item, { method: 'DELETE', account: second })).status, 404);
  assert.equal((await request(subscriptions, { method: 'POST', account: second, data, accountId: first.id })).status, 401);
  assert.equal((await request(subscriptions, { method: 'POST', account: second, data: { ...data, ownerId: first.id } })).status, 400);
  assert.deepEqual(await list(second), []);

  const edit = await request(item, { method: 'PUT', account: first, data: { ...data, cost: 99, nextRenewal: '2028-03-01' } });
  assert.equal(edit.status, 200);
  assert.deepEqual((await edit.json()).subscription, { ...subscription, cost: 99, nextRenewal: '2028-03-01' });
  assert.equal((await request('/api/auth/logout', { method: 'POST', account: first, data: {} })).status, 200);
  assert.equal((await request(subscriptions, { account: first })).status, 401);
  const login = await request('/api/auth/login', { method: 'POST', data: { email: first.email, password } });
  assert.equal(login.status, 200);
  first.cookie = login.headers.get('set-cookie').split(';')[0];
  assert.deepEqual(await list(first), [{ ...subscription, cost: 99, nextRenewal: '2028-03-01' }]);
  assert.equal((await request(item, { method: 'DELETE', account: first })).status, 204);
  assert.deepEqual(await list(first), []);
});
