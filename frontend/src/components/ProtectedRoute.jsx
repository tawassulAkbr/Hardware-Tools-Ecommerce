import { Navigate } from 'react-router-dom';
import { getAuth } from '../api';

const ProtectedRoute = ({ role, children }) => {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (role && (Array.isArray(role) ? !role.includes(auth.user?.role) : auth.user?.role !== role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
