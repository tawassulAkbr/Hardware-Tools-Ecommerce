import { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    try { const result = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(result.message); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gray-50 px-6 py-12"><div className="w-full max-w-md border border-gray-200 bg-white p-8 shadow-sm"><Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link><div className="mt-10"><div className="flex h-12 w-12 items-center justify-center bg-blue-50 text-blue-600"><Mail className="h-6 w-6" /></div><h1 className="mt-6 text-3xl font-bold">Forgot your password?</h1><p className="mt-2 text-gray-500">Enter your account email and we will send a secure reset link.</p></div><form onSubmit={submit} className="mt-8 space-y-5">{message && <div className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}{error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<label className="block"><span className="mb-2 block text-sm font-medium">Email address</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="w-full border border-gray-300 px-3 py-3 outline-none focus:border-blue-500" placeholder="you@example.com" /></label><button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:bg-gray-400">{loading ? 'Sending link...' : 'Send reset link'} <Send className="h-4 w-4" /></button></form></div></div>;
};

export default ForgotPassword;
