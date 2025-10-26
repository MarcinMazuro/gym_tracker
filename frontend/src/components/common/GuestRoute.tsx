import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface GuestRouteProps {
  children: ReactNode;
}

// Restricts access to guests (not authenticated users).
// If the user is authenticated, redirect them to the dashboard.
export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Avoid flicker until we know the auth state
  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default GuestRoute;
