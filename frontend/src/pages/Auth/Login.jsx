import { useState } from 'react';
import { ArrowRight, LockKeyhole, MapPin, Phone, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { api, setAuth } from '../../api';
import GoogleButton from '../../components/GoogleButton';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (!isLogin && payload.password !== payload.confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
    delete payload.confirmPassword;
    try {
      const auth = await api(isLogin ? '/auth/login' : '/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      setAuth(auth); window.dispatchEvent(new Event('auth-change')); navigate(auth.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleGoogle = async (credential) => {
    setLoading(true); setError('');
    try {
      const auth = await api('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
      setAuth(auth); window.dispatchEvent(new Event('auth-change')); navigate('/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gray-50 px-6 py-12 sm:px-10"><motion.div className="grid w-full max-w-5xl overflow-hidden border border-gray-200 bg-white shadow-xl lg:grid-cols-[0.85fr_1.15fr]" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
    <aside className="hidden bg-[#111827] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">ToolKit</p><h1 className="mt-8 text-4xl font-bold leading-tight">Your personal toolkit, ready when you are.</h1><p className="mt-5 leading-7 text-gray-300">Keep your tools, delivery details, and orders connected in one place.</p></div><div className="border-t border-gray-700 pt-5 text-sm text-gray-400"><p>Professional tools. Clear pricing. Simpler work.</p></div></aside>
    <main className="p-7 sm:p-10"><div className="mb-8 flex border-b border-gray-200"><button onClick={() => { setIsLogin(true); setError(''); }} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Sign in</button><button onClick={() => { setIsLogin(false); setError(''); }} className={`ml-6 border-b-2 px-1 pb-3 text-sm font-semibold ${!isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Create account</button></div><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">{isLogin ? 'Welcome back' : 'New to ToolKit'}</p><h2 className="mt-2 text-3xl font-bold text-gray-900">{isLogin ? 'Sign in to continue' : 'Create your account'}</h2><p className="mt-2 text-gray-500">{isLogin ? 'Access your cart, orders, and saved details.' : 'Tell us where to reach you so checkout is faster.'}</p></div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>{error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!isLogin && <div className="grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-medium">Full name</span><span className="relative block"><UserRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input name="name" required className="w-full border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500" placeholder="Your name" /></span></label><label><span className="mb-2 block text-sm font-medium">Contact number</span><span className="relative block"><Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input name="phone" type="tel" required className="w-full border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500" placeholder="03xx xxxxxxx" /></span></label><label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium">Delivery address</span><span className="relative block"><MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><textarea name="address" required className="min-h-24 w-full resize-y border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500" placeholder="Street, area, city" /></span></label></div>}
        <label className="block"><span className="mb-2 block text-sm font-medium">Email address</span><input name="email" type="email" required className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="you@example.com" /></label><label className="block"><span className="mb-2 block text-sm font-medium">Password</span><span className="relative block"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input name="password" type="password" minLength="6" required className="w-full border border-gray-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500" placeholder="At least 6 characters" /></span></label>{!isLogin && <label className="block"><span className="mb-2 block text-sm font-medium">Confirm password</span><input name="confirmPassword" type="password" minLength="6" required className="w-full border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Repeat your password" /></label>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:bg-gray-400">{loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" /></button>
      </form><div className="my-7 flex items-center gap-3 text-xs uppercase tracking-widest text-gray-400"><span className="h-px flex-1 bg-gray-200" />or<span className="h-px flex-1 bg-gray-200" /></div><GoogleButton onSuccess={handleGoogle} onError={setError} />{isLogin && <div className="mt-5 text-center text-sm"><Link to="/forgot-password" className="font-semibold text-gray-500 hover:text-blue-600">Forgot password?</Link></div>}<p className="mt-8 text-center text-sm text-gray-500">{isLogin ? 'New here?' : 'Already have an account?'} <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-semibold text-blue-600 hover:underline">{isLogin ? 'Create an account' : 'Sign in instead'}</button></p>
    </main>
  </motion.div></div>;
};

export default Login;
