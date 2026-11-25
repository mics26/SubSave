import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

test('MySQL account can register, restore its session, log out, and log in', async () => {
  const baseUrl = process.env.SUBSAVE_AUTH_TEST_URL;
  assert.ok(baseUrl, 'Set SUBSAVE_AUTH_TEST_URL to a disposable server-backed preview.');
  const request = (path, data, cookie) => fetch(new URL('/api/auth/' + path, baseUrl), {
    method: data === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: new URL(baseUrl).origin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });

  const credentials = { email: `auth-${randomUUID()}@example.test`, password: 'AuthSmokeCheck-2026!' };
  const signup = await request('register', { ...credentials, name: 'Auth Smoke Test' });
  assert.equal(signup.status, 201);
  const { user } = await signup.json();
  const cookieHeader = signup.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/);
  const cookie = cookieHeader.split(';')[0];
  assert.deepEqual(await (await request('session', undefined, cookie)).json(), { user });

  assert.equal((await request('logout', {}, cookie)).status, 200);
  assert.deepEqual(await (await request('session', undefined, cookie)).json(), { user: null });
  assert.equal((await request('login', { ...credentials, password: 'wrong password' })).status, 401);
  const login = await request('login', credentials);
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), { user });
});
