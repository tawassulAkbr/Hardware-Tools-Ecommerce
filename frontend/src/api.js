export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getAuth = () => JSON.parse(localStorage.getItem('toolkit_auth') || 'null');
export const setAuth = (auth) => localStorage.setItem('toolkit_auth', JSON.stringify(auth));
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
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const money = (value) => new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));
