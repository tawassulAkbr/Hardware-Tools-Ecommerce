import { Navigate } from 'react-router-dom';
import { getAuth } from '../api';

const ProtectedRoute = ({ role, children }) => {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (role && (Array.isArray(role) ? !role.includes(auth.user?.role) : auth.user?.role !== role)) {
    const destination = ['ADMIN', 'SALES_PERSON'].includes(auth.user?.role) ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={destination} replace />;
  }
  return children;
};

export default ProtectedRoute;
