import { createServer } from 'node:http';
import { AccountError } from '../src/accounts/accountFields.js';
import { MAX_SUBSCRIPTION_ICON_BYTES } from '../src/subscriptions/subscriptionRecord.js';
import { createAccountStore, SESSION_MAX_AGE } from './auth/accountStore.js';
import { createSubscriptionStore, SubscriptionInputError } from './subscriptions/subscriptionStore.js';

const SESSION_COOKIE = 'subsave_session';
const BODY_LIMIT = 4096;
const SUBSCRIPTION_BODY_LIMIT = Math.ceil(MAX_SUBSCRIPTION_ICON_BYTES / 3) * 4 + BODY_LIMIT;

export function readSessionToken(request) {
  const cookie = (request.headers.cookie ?? '').split(';').map((part) => part.trim())
    .find((part) => part.startsWith(SESSION_COOKIE + '='));
  const token = cookie?.slice(SESSION_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token ?? '') ? token : null;
}

function sessionCookie(token, secure) {
  const attributes = [`${SESSION_COOKIE}=${token ?? ''}`, 'Path=/api', 'HttpOnly', 'SameSite=Lax',
    `Max-Age=${token ? SESSION_MAX_AGE : 0}`];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

function verifyOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return;
  const parsed = URL.parse(origin);
  if (!parsed || !['http:', 'https:'].includes(parsed.protocol) || parsed.host !== request.headers.host) {
    throw new AccountError('Request origin is not allowed.', {}, 403);
  }
}

async function readJson(request, bodyLimit = BODY_LIMIT) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new AccountError('Send the request as JSON.', {}, 415);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > bodyLimit) {
      request.resume();
      throw new AccountError('The request is too large.', {}, 413);
    }
    chunks.push(chunk);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch {
    // The response uses the same message for invalid JSON and non-object bodies.
  }
  throw new AccountError('Send a valid JSON object.');
}

async function handleSubscriptions(request, response, store, id) {
  const method = request.method;
  if (!id && method === 'GET') {
    const subscriptions = await store.list();
    response.end(JSON.stringify({ subscriptions }));
    return;
  }

  verifyOrigin(request);
  if (!id && method === 'POST') {
    const subscription = await store.add(await readJson(request, SUBSCRIPTION_BODY_LIMIT));
    response.statusCode = 201;
    response.end(JSON.stringify({ subscription }));
    return;
  }
  if (id && method === 'PUT') {
    const subscription = await store.edit(id, await readJson(request, SUBSCRIPTION_BODY_LIMIT));
    if (!subscription) throw new AccountError('Subscription not found.', {}, 404);
    response.end(JSON.stringify({ subscription }));
    return;
  }
  if (id && method === 'DELETE') {
    if (!(await store.delete(id))) throw new AccountError('Subscription not found.', {}, 404);
    response.statusCode = 204;
    response.end();
    return;
  }
  throw new AccountError('Method not allowed.', {}, 405);
}

export function createAppServer(database, { secureCookies = false } = {}) {
  const accounts = createAccountStore(database);
  const mutations = {
    'POST /api/auth/register': (token, data) => accounts.register(data, token),
    'POST /api/auth/login': (token, data) => accounts.login(data, token),
    'POST /api/auth/logout': async (token) => {
      await accounts.logout(token);
      return { user: null, token: null };
    },
    'PATCH /api/auth/account': (token, data) => accounts.updateAccount(token, data),
  };

  return createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    const route = `${request.method} ${request.url}`;
    const subscriptionPath = /^\/api\/subscriptions(?:\/([^/]+))?$/.exec(request.url.split('?')[0]);
    try {
      const token = readSessionToken(request);
      if (subscriptionPath) {
        const user = await accounts.currentAccount(token);
        const expectedAccount = request.headers['x-subsave-account'];
        if (!user || (expectedAccount !== undefined && expectedAccount !== user.id)) {
          throw new AccountError('Your session changed. Log in again to continue.', {}, 401);
        }
        const store = createSubscriptionStore(database, user.id);
        await handleSubscriptions(request, response, store, subscriptionPath[1]);
        return;
      }
      if (route === 'GET /api/auth/session') {
        const user = await accounts.currentAccount(token);
        response.end(JSON.stringify({ user }));
        return;
      }
      if (!Object.hasOwn(mutations, route)) throw new AccountError('Route not found.', {}, 404);
      verifyOrigin(request);
      const { user, token: newToken } = await mutations[route](token, await readJson(request));
      if (newToken !== undefined) response.setHeader('Set-Cookie', sessionCookie(newToken, secureCookies));
      response.statusCode = route === 'POST /api/auth/register' ? 201 : 200;
      response.end(JSON.stringify({ user }));
    } catch (error) {
      let failure = error;
      if (error instanceof SubscriptionInputError) {
        failure = new AccountError(error.message);
      } else if (!(error instanceof AccountError)) {
        const service = subscriptionPath ? 'subscription' : 'account';
        console.error('SubSave API error:', error.code ?? error.name);
        failure = new AccountError(`The ${service} service is unavailable. Please try again.`, {}, 503);
      }
      response.statusCode = failure.status;
      response.end(JSON.stringify({ message: failure.message, fields: failure.fields }));
    }
  });
}
