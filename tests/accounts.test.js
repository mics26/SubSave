import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACCOUNT_STORAGE_KEY, createAccountService } from '../src/accounts/accountService.js';

const details = { name: 'Demo User', email: 'demo@example.com', password: 'DemoPass123!' };

function setup() {
  const records = new Map();
  const storage = {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
  };
  return { records, storage, service: createAccountService(() => storage) };
}

test('registers, restores session after reload, logs out persistently, and logs back in', async () => {
  const { service, storage, records } = setup();
  assert.equal(service.currentAccount(), null);
  const user = await service.register({ ...details, name: ' Demo User ', email: ' Demo@Example.com ' });
  assert.deepEqual(user, { id: user.id, name: 'Demo User', email: details.email });
  const reloaded = createAccountService(() => storage);
  assert.deepEqual(reloaded.currentAccount(), user);
  const raw = records.get(ACCOUNT_STORAGE_KEY);
  assert.equal(raw.includes(details.password), false);
  assert.equal(JSON.parse(raw).accounts[0].passwordHash.length, 64);
  service.logout();
  assert.equal(reloaded.currentAccount(), null);
  assert.deepEqual(await reloaded.login({ ...details, email: ' DEMO@example.com ' }), user);
});

test('validates empty and invalid registration fields without writing data', async () => {
  const { service, records } = setup();
  for (const invalid of [
    { name: '', email: '', password: '' },
    { name: ' '.repeat(3), email: 'bad-email', password: 'short' },
    { name: 'x'.repeat(81), email: 'a@b.com', password: ' '.repeat(8) },
    { ...details, password: 'x'.repeat(129) },
  ]) {
    await assert.rejects(service.register(invalid), (error) => Boolean(error.fields && Object.keys(error.fields).length));
  }
  assert.equal(records.size, 0);
});

test('rejects duplicate emails regardless of casing and preserves all accounts', async () => {
  const { service, records } = setup();
  await service.register(details);
  await assert.rejects(service.register({ ...details, email: 'DEMO@example.com' }), /already uses this email/);
  await service.register({ ...details, email: 'other@example.com' });
  const accounts = JSON.parse(records.get(ACCOUNT_STORAGE_KEY)).accounts;
  assert.equal(accounts.length, 2);
  assert.notEqual(accounts[0].salt, accounts[1].salt);
});

test('invalid logins do not create a session', async () => {
  const { service } = setup();
  await service.register(details);
  service.logout();
  await assert.rejects(service.login({ email: '', password: '' }), /highlighted fields/);
  await assert.rejects(service.login({ ...details, password: 'WrongPassword' }), /incorrect/);
  await assert.rejects(service.login({ ...details, email: 'missing@example.com' }), /incorrect/);
  assert.equal(service.currentAccount(), null);
});

test('saves profile details, requires current password for sensitive changes, and replaces login credentials', async () => {
  const { service, storage } = setup();
  const user = await service.register(details);
  await service.updateAccount(user.id, { ...details, name: 'Updated User', password: '' });
  assert.equal(createAccountService(() => storage).currentAccount().name, 'Updated User');
  const changes = { name: 'Updated User', email: 'updated@example.com', password: 'UpdatedPass123!' };
  await assert.rejects(service.updateAccount(user.id, changes), /current password/);
  await assert.rejects(service.updateAccount(user.id, { ...changes, currentPassword: 'wrong' }), /current password/);
  const updated = await service.updateAccount(user.id, { ...changes, currentPassword: details.password });
  assert.equal(updated.email, changes.email);
  service.logout();
  await assert.rejects(service.login(details), /incorrect/);
  await assert.rejects(service.login({ email: changes.email, password: details.password }), /incorrect/);
  assert.deepEqual(await service.login(changes), updated);
});

test('blocks duplicate email edits and edits after logout or account switches', async () => {
  const { service } = setup();
  const first = await service.register(details);
  const second = await service.register({ ...details, email: 'other@example.com' });
  await assert.rejects(service.updateAccount(first.id, { ...details, password: '' }), /session has changed/);
  await assert.rejects(service.updateAccount(second.id, { ...details, currentPassword: details.password }), /already uses this email/);
  service.logout();
  await assert.rejects(service.updateAccount(second.id, { ...details, password: '' }), /session has changed/);
});

test('simulated recovery validates email and code, persists new password, and consumes the code', async () => {
  const { service, storage } = setup();
  await service.register(details);
  assert.throws(() => service.requestReset(''), /account email/);
  assert.throws(() => service.requestReset('missing@example.com'), /No account/);
  const code = service.requestReset(' DEMO@example.com ');
  assert.match(code, /^\d{6}$/);
  const wrongCode = code === '000000' ? '111111' : '000000';
  await assert.rejects(service.resetPassword({ code: wrongCode, password: 'ResetPass123!' }), /incorrect/);
  await assert.rejects(service.resetPassword({ code, password: 'short' }), /highlighted fields/);
  await service.resetPassword({ code, password: 'ResetPass123!' });
  const reloaded = createAccountService(() => storage);
  assert.equal(reloaded.currentAccount(), null);
  await assert.rejects(reloaded.login(details), /incorrect/);
  assert.equal((await reloaded.login({ ...details, password: 'ResetPass123!' })).email, details.email);
  await assert.rejects(service.resetPassword({ code, password: 'AnotherPass123!' }), /expired/);
});

test('recovery code is lost on reload or cancellation and replaced by a new request', async () => {
  const { service, storage } = setup();
  await service.register(details);
  const code = service.requestReset(details.email);
  await assert.rejects(createAccountService(() => storage).resetPassword({ code, password: 'NewPass123!' }), /expired/);
  service.cancelRecovery();
  await assert.rejects(service.resetPassword({ code, password: 'NewPass123!' }), /expired/);
  service.requestReset(details.email);
  const secondCode = service.requestReset(details.email);
  await service.resetPassword({ code: secondCode, password: 'NewPass123!' });
});

test('recovery code expires and locks after five incorrect attempts', async (context) => {
  const { service } = setup();
  await service.register(details);
  const code = service.requestReset(details.email);
  const wrongCode = code === '000000' ? '111111' : '000000';
  for (let index = 0; index < 4; index += 1) {
    await assert.rejects(service.resetPassword({ code: wrongCode, password: 'ResetPass123!' }), /incorrect/);
  }
  await assert.rejects(service.resetPassword({ code: wrongCode, password: 'ResetPass123!' }), /Too many/);
  await assert.rejects(service.resetPassword({ code, password: 'ResetPass123!' }), /expired/);
  const expiringCode = service.requestReset(details.email);
  const future = Date.now() + 600_001;
  context.mock.method(Date, 'now', () => future);
  await assert.rejects(service.resetPassword({ code: expiringCode, password: 'ResetPass123!' }), /expired/);
});

test('a profile credential change invalidates outstanding recovery', async () => {
  const { service, storage } = setup();
  const user = await service.register(details);
  const code = service.requestReset(details.email);
  const anotherTab = createAccountService(() => storage);
  await anotherTab.updateAccount(user.id, { ...details, password: 'ChangedPass123!', currentPassword: details.password });
  await assert.rejects(service.resetPassword({ code, password: 'ResetPass123!' }), /account changed/);
});

test('reports corrupt storage without replacing saved data', async () => {
  const { service, records } = setup();
  for (const raw of ['broken-json', 'null', '{"version":9}', '{"version":1,"accounts":[{}],"sessionUserId":null}']) {
    records.set(ACCOUNT_STORAGE_KEY, raw);
    assert.throws(() => service.currentAccount(), /could not be read/);
    await assert.rejects(service.register(details), /could not be read/);
    assert.equal(records.get(ACCOUNT_STORAGE_KEY), raw);
  }
});

test('reports denied reads and failed writes without claiming successful persistence', async () => {
  const denied = createAccountService(() => { throw new Error('SecurityError'); });
  assert.throws(() => denied.currentAccount(), /storage is unavailable/);
  await assert.rejects(denied.register(details), /storage is unavailable/);
  const { service, storage } = setup();
  const user = await service.register(details);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => service.logout(), /could not be saved/);
  await assert.rejects(service.updateAccount(user.id, { ...details, name: 'Unsaved', password: '' }), /could not be saved/);
  assert.deepEqual(service.currentAccount(), user);
});
