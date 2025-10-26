import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import KioskNavigation from '../feature/KioskNavigation';

interface KioskLayoutProps {
  children: React.ReactNode;
}

const KioskLayout = ({ children }: KioskLayoutProps) => {
  const location = useLocation();
  const { isLoading } = useAuth();

  // Show loading while determining user type
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <KioskNavigation />
      <div className="pt-20" key={location.pathname}>
        {children}
      </div>
    </>
  );
};

export default KioskLayout;
