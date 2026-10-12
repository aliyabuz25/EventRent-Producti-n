export const TOKEN_KEY = 'er_admin_token';

export function getToken(): string {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('auth-changed'));
}

export function sessionExpired() {
  clearSession();
  const current = window.location.pathname;
  window.location.href = `/login?reason=session_expired&from=${encodeURIComponent(current)}`;
}

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit  = RequestInit & { skipAuth?: boolean };

export async function apiFetch(input: FetchInput, init: FetchInit = {}): Promise<Response> {
  const { skipAuth, ...rest } = init;

  if (!skipAuth) {
    const token = getToken();
    rest.headers = {
      ...rest.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const res = await fetch(input, rest);

  if (res.status === 401) {
    sessionExpired();
    return new Response(null, { status: 401 });
  }

  return res;
}