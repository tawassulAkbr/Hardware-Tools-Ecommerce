import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import PageLoader from './components/PageLoader';
import LandingPage from './pages/LandingPage';
import ProductsPage from './pages/ProductsPage';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Buyer/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';
import Cart from './pages/Buyer/Cart';
import Checkout from './pages/Buyer/Checkout';
import OrderConfirmation from './pages/Buyer/OrderConfirmation';
import ProtectedRoute from './components/ProtectedRoute';
import ContactPage from './pages/ContactPage';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute role={['ADMIN', 'SALES_PERSON']}><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
