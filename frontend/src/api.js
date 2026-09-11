export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const sanitizeAuth = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const user = value.user;
  if (!user || typeof user !== 'object' || Array.isArray(user) || typeof value.token !== 'string' || !value.token.trim()) return null;
  return {
    token: value.token.trim(),
    user: {
      id: typeof user.id === 'number' || typeof user.id === 'string' ? user.id : undefined,
      email: typeof user.email === 'string' ? user.email : '',
      name: typeof user.name === 'string' ? user.name : '',
      phone: typeof user.phone === 'string' ? user.phone : '',
      address: typeof user.address === 'string' ? user.address : '',
      role: ['BUYER', 'ADMIN', 'SALES_PERSON'].includes(user.role) ? user.role : 'BUYER',
      status: typeof user.status === 'string' ? user.status : undefined,
    },
  };
};

export const getAuth = () => {
  try { return sanitizeAuth(JSON.parse(localStorage.getItem('toolkit_auth') || 'null')); }
  catch { localStorage.removeItem('toolkit_auth'); return null; }
};
export const setAuth = (auth) => {
  const safeAuth = sanitizeAuth(auth);
  if (safeAuth) localStorage.setItem('toolkit_auth', JSON.stringify(safeAuth));
  else localStorage.removeItem('toolkit_auth');
};
export const clearAuth = () => localStorage.removeItem('toolkit_auth');

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
