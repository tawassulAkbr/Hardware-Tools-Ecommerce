export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AUTH_STORAGE_KEY = 'toolkit_auth';
const safeText = (value, maxLength) => typeof value === 'string'
  ? Array.from(value).filter((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127; }).join('').slice(0, maxLength)
  : '';

const sanitizeAuth = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const user = value.user;
  const token = safeText(value.token, 4096).trim();
  if (!user || typeof user !== 'object' || Array.isArray(user) || !/^[A-Za-z0-9._~-]+$/.test(token)) return null;
  return {
    token,
    user: {
      id: typeof user.id === 'number' || (typeof user.id === 'string' && /^\d+$/.test(user.id)) ? user.id : undefined,
      email: safeText(user.email, 160),
      name: safeText(user.name, 120),
      phone: safeText(user.phone, 40),
      address: safeText(user.address, 500),
      role: ['BUYER', 'ADMIN', 'SALES_PERSON'].includes(user.role) ? user.role : 'BUYER',
      status: safeText(user.status, 40) || undefined,
    },
  };
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
    const serializedAuth = JSON.stringify({ token: safeAuth.token, user: { ...safeAuth.user } });
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
