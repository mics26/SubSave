import { createServer } from 'node:http';
import { AccountError } from '../../src/accounts/accountFields.js';
import { createAccountStore, SESSION_MAX_AGE } from './accountStore.js';

const SESSION_COOKIE = 'subsave_session';
const BODY_LIMIT = 4096;

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

async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new AccountError('Send the account details as JSON.', {}, 415);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      request.resume();
      throw new AccountError('The account details are too large.', {}, 413);
    }
    chunks.push(chunk);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch {
    // The response uses the same message for invalid JSON and non-object bodies.
  }
  throw new AccountError('Send valid account details.');
}

export function createAuthServer(database, { secureCookies = false } = {}) {
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
    try {
      const token = readSessionToken(request);
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
      const failure = error instanceof AccountError ? error :
        new AccountError('The account service is unavailable. Please try again.', {}, 503);
      if (failure !== error) console.error('Account API error:', error.code ?? error.name);
      response.statusCode = failure.status;
      response.end(JSON.stringify({ message: failure.message, fields: failure.fields }));
    }
  });
}
