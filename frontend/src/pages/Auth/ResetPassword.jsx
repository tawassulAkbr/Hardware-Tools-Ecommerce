import { useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) return setError('Password must be 8+ characters and include uppercase, lowercase, a number, and a special character.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try { const result = await api(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) }); setMessage(result.message); window.setTimeout(() => navigate('/login'), 1200); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gray-50 px-6 py-12"><div className="w-full max-w-md border border-gray-200 bg-white p-8 shadow-sm"><div className="flex h-12 w-12 items-center justify-center bg-blue-50 text-blue-600"><KeyRound className="h-6 w-6" /></div><h1 className="mt-6 text-3xl font-bold">Set a new password</h1><p className="mt-2 text-gray-500">Choose a strong password for your ToolKit account.</p><form onSubmit={submit} className="mt-8 space-y-5">{message && <div className="flex gap-2 border border-green-200 bg-green-50 p-3 text-sm text-green-700"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}{error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<label className="block"><span className="mb-2 block text-sm font-medium">New password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength="6" required className="w-full border border-gray-300 px-3 py-3 outline-none focus:border-blue-500" placeholder="At least 6 characters" /></label><label className="block"><span className="mb-2 block text-sm font-medium">Confirm password</span><input value={confirm} onChange={(event) => setConfirm(event.target.value)} type="password" minLength="6" required className="w-full border border-gray-300 px-3 py-3 outline-none focus:border-blue-500" placeholder="Repeat your password" /></label><button type="submit" disabled={loading} className="w-full bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:bg-gray-400">{loading ? 'Updating password...' : 'Update password'}</button></form><Link to="/login" className="mt-6 block text-center text-sm font-semibold text-gray-500 hover:text-blue-600">Return to sign in</Link></div></div>;
};

export default ResetPassword;
