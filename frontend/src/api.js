export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_STORAGE_KEY = 'toolkit_auth';
const safeText = (value, maxLength = 4096) => typeof value === 'string'
  ? Array.from(value).filter((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127; }).join('').slice(0, maxLength)
  : value;

const sanitizeValue = (value, seen = new WeakSet()) => {
  if (typeof value === 'string') return safeText(value);
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, seen));
  if (typeof value !== 'object' || seen.has(value)) return undefined;

  seen.add(value);
  const clean = Object.create(null);
  Object.keys(value).forEach((key) => {
    const safeKey = safeText(key, 128);
    if (safeKey) clean[safeKey] = sanitizeValue(value[key], seen);
  });
  seen.delete(value);
  return clean;
};

const sanitizeAuth = (value) => {
  const clean = sanitizeValue(value);
  const token = typeof clean?.token === 'string' ? clean.token.trim() : '';
  const user = clean?.user;
  if (!clean || Array.isArray(clean) || typeof user !== 'object' || Array.isArray(user) || !/^[A-Za-z0-9._~-]+$/.test(token)) return null;
  if (!['BUYER', 'ADMIN', 'SALES_PERSON'].includes(user.role)) return null;
  clean.token = token;
  return clean;
};

export const getAuth = () => {
  try {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    const auth = sanitizeAuth(storedAuth ? JSON.parse(storedAuth) : null);
    if (!auth && storedAuth !== null) localStorage.removeItem(AUTH_STORAGE_KEY);
    return auth;
  }
  catch { localStorage.removeItem(AUTH_STORAGE_KEY); return null; }
};
export const setAuth = (auth) => {
  const safeAuth = sanitizeAuth(auth);
  if (safeAuth) {
    const serializedAuth = JSON.stringify(safeAuth);
    localStorage.setItem(AUTH_STORAGE_KEY, serializedAuth);
  } else localStorage.removeItem(AUTH_STORAGE_KEY);
};
export const clearAuth = () => localStorage.removeItem(AUTH_STORAGE_KEY);

export const api = async (path, options = {}) => {
  const auth = getAuth();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const error = new Error(data.error || 'Request failed'); error.status = res.status; throw error; }
  return data;
};

export const money = (value) => new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));
