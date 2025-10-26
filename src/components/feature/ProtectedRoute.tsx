import { type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'customer' | 'admin' | 'kiosk';
  allowedRoles?: ('customer' | 'admin' | 'kiosk')[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowedRoles, 
  redirectTo = '/login' 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, isAdmin, isKiosk, isInitialized } = useAuth();

  useEffect(() => {
    // Wait for auth to initialize before checking
    if (isLoading || !isInitialized) {
      console.log('🔄 ProtectedRoute: Waiting for auth initialization...', { isLoading, isInitialized });
      return;
    }

    console.log('🔍 ProtectedRoute: Auth initialized, checking access...', { 
      isAuthenticated, 
      userRole: user?.role, 
      requiredRole,
      currentPath: window.location.pathname,
      user: user ? `${user.role} (${user.email})` : 'null'
    });

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      console.log('❌ ProtectedRoute: Not authenticated, redirecting to login');
      navigate(redirectTo);
      return;
    }

    // Special handling for kiosk users - restrict to kiosk routes only
    if (isKiosk) {
      const currentPath = window.location.pathname;
      const allowedKioskPaths = ['/kiosk', '/kiosk/', '/kiosk-login'];
      const isKioskPath = allowedKioskPaths.some(path => 
        currentPath === path || currentPath.startsWith('/kiosk/')
      );
      
      if (!isKioskPath) {
        navigate('/kiosk');
        return;
      }
    }

    // Check role-based access
    if (requiredRole) {
      const hasRequiredRole = 
        (requiredRole === 'admin' && isAdmin) ||
        (requiredRole === 'kiosk' && isKiosk) ||
        (requiredRole === 'customer' && user?.role === 'customer');

      if (!hasRequiredRole) {
        // Redirect based on user role
        if (isAdmin) {
          navigate('/admin');
        } else if (isKiosk) {
          navigate('/kiosk');
        } else {
          navigate('/');
        }
        return;
      }
    }

    // Check allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      const hasAllowedRole = allowedRoles.includes(user?.role as any);
      
      if (!hasAllowedRole) {
        // Redirect based on user role
        if (isAdmin) {
          navigate('/admin');
        } else if (isKiosk) {
          navigate('/kiosk');
        } else {
          navigate('/');
        }
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isKiosk, user?.role, isLoading, isInitialized, navigate, requiredRole, allowedRoles, redirectTo]);

  // Show loading while checking authentication
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or doesn't have required role
  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'admin' && isAdmin) ||
      (requiredRole === 'kiosk' && isKiosk) ||
      (requiredRole === 'customer' && user?.role === 'customer');

    if (!hasRequiredRole) {
      return null;
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.includes(user?.role as any);
    if (!hasAllowedRole) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;