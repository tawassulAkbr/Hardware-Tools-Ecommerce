import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, LogOut, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearAuth, getAuth } from '../api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [auth, setAuthState] = useState(getAuth());
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('toolkit_theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('toolkit_theme', darkMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('theme-change'));
  }, [darkMode]);

  useEffect(() => {
    const update = () => setAuthState(getAuth());
    window.addEventListener('storage', update);
    window.addEventListener('auth-change', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('auth-change', update);
    };
  }, []);

  const logout = () => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${auth?.token}` } }).catch(() => {});
    clearAuth();
    setAuthState(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <nav className="bg-black text-white px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-wider">ToolKit</Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 items-center">
          <Link to="/products?category=Tools" className="hover:text-gray-300 transition">Tools</Link>
          <Link to="/products?category=Safety%20Equipment" className="hover:text-gray-300 transition">Safety Equipment</Link>
          <a href="#footer" className="hover:text-gray-300 transition">Contact Us</a>
          <form action="/products" className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-44 rounded bg-white px-8 py-2 text-sm text-black outline-none" />
          </form>
          <button type="button" onClick={() => setDarkMode((value) => !value)} className="rounded p-2 text-gray-300 transition hover:bg-white/10 hover:text-white" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
          
          <div className="flex space-x-6 items-center ml-4 border-l border-gray-700 pl-6">
            {auth?.token ? (
              <>
                <Link to={auth.user.role === 'ADMIN' || auth.user.role === 'SALES_PERSON' ? '/admin/dashboard' : '/dashboard'} className="flex items-center hover:text-gray-300 transition">
                  <LayoutDashboard className="w-5 h-5 mr-1" /><span>{auth.user.name}</span>
                </Link>
                <button onClick={logout} className="hover:text-gray-300"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <Link to="/login" className="flex items-center hover:text-gray-300 transition"><User className="w-5 h-5 mr-1" /><span>Login</span></Link>
            )}
            <Link to="/cart" className="flex items-center hover:text-gray-300 transition relative">
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-black transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 p-6`}>
        <div className="flex flex-col space-y-6">
          <Link to="/" className="text-2xl font-bold" onClick={() => setIsOpen(false)}>ToolKit</Link>
          <Link to="/products?category=Tools" onClick={() => setIsOpen(false)}>Tools</Link>
          <Link to="/products?category=Safety%20Equipment" onClick={() => setIsOpen(false)}>Safety Equipment</Link>
          <Link to={auth?.user?.role === 'ADMIN' || auth?.user?.role === 'SALES_PERSON' ? '/admin/dashboard' : auth ? '/dashboard' : '/login'} className="flex items-center" onClick={() => setIsOpen(false)}>
            <User className="w-5 h-5 mr-2" /> {auth ? 'Profile' : 'Login'}
          </Link>
          <Link to="/cart" className="flex items-center" onClick={() => setIsOpen(false)}>
            <ShoppingCart className="w-5 h-5 mr-2" /> Cart
          </Link>
          <button type="button" className="flex items-center" onClick={() => { setDarkMode((value) => !value); setIsOpen(false); }}><span className="mr-2">{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</span>{darkMode ? 'Light mode' : 'Dark mode'}</button>
          {auth && <button onClick={logout} className="flex items-center"><LogOut className="w-5 h-5 mr-2" /> Logout</button>}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
