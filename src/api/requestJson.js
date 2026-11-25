class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export async function requestJson(path, { method = 'GET', data, headers = {}, service } = {}) {
  const options = { method, credentials: 'same-origin', headers };
  if (data !== undefined) {
    options.headers = { ...headers, 'Content-Type': 'application/json' };
    options.body = JSON.stringify(data);
  }
  let response;
  let result;
  try {
    response = await fetch(path, options);
    if (response.status === 204) return null;
    result = await response.json();
  } catch {
    throw new ApiError(`Could not reach the ${service} service. Please try again.`, response?.status);
  }
  if (!response.ok) {
    throw new ApiError(result?.message || `The ${service} service is unavailable.`, response.status, result?.fields);
  }
  return result;
}
