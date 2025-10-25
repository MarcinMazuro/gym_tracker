import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';


//ProtectedRoute Props
interface ProtectedRouteProps {
    children: ReactNode;
}

//ProtectedRoute Component
//Wraps protected pages - redirects to login if not authenticated
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated - render the protected page
    return <>{children}</>;
};
