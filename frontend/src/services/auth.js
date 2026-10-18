const AUTH_STORAGE_KEY = 'noor-auth';

export function getAuth() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    return auth?.token && auth?.user ? auth : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveAuth(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function apiRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const auth = getAuth();

  if (auth?.token) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Keep the HTTP status message when the response has no JSON body.
    }
    const error = new Error(message);
    error.status = response.status;
    if (response.status === 401) {
      clearAuth();
      window.dispatchEvent(new Event('noor:unauthorized'));
    }
    throw error;
  }

  return response;
}

export async function authenticate(path, credentials) {
  const response = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const body = await response.json();

  if (!response.ok) {
    const error = new Error(body.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const legacyRole = body.user.role === 'Citizen'
    ? 'citizen'
    : ['Volunteer', 'NGO Field Agent'].includes(body.user.role)
      ? 'ngo'
      : ['Government Control Room', 'System Admin'].includes(body.user.role)
        ? 'admin'
        : null;
  const accessRole = body.user.accessRole || legacyRole;

  if (!['citizen', 'ngo', 'admin'].includes(accessRole)) {
    throw new Error('This account has an unsupported role. Contact an administrator.');
  }

  const user = { ...body.user, accessRole };
  const auth = { token: body.token, user };
  saveAuth(auth);
  return auth;
}
