import { useLocation } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminSidebar from '../feature/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { isLoading } = useAuth();
  const lastPathnameRef = useRef(location.pathname);

  // Phase 1: Only re-mount when pathname actually changes (not on every render)
  useEffect(() => {
    if (lastPathnameRef.current !== location.pathname) {
      console.log('🔄 AdminLayout: Route changed, triggering fresh page reload', {
        from: lastPathnameRef.current,
        to: location.pathname
      });
      lastPathnameRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Show loading while determining user type
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-64" key={location.pathname}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
