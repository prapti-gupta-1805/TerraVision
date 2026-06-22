import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)]">
        <div className="text-[var(--color-text-main)]">Loading...</div>
      </div>
    );
  }

  if (requireAuth) {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
  } else {
    if (isAuthenticated) {
      return <Navigate to="/map" replace />;
    }
  }

  return <>{children}</>;
};
