import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole = 'admin' }) {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  if (requiredRole === 'admin') {
    if (!currentUser || !isAdmin) {
      // Redirect unauthenticated / unauthorized users to admin login page
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
  }

  return children;
}
