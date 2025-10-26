import { useAuth } from '../../hooks/useAuth';
import TopNavigation from '../feature/TopNavigation';
import BottomNavigation from '../feature/BottomNavigation';
import KioskNavigation from '../feature/KioskNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { isKiosk, isLoading, isAdmin } = useAuth();

  // Show loading while determining user type
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Kiosk users now use KioskLayout (handled in router), so no navigation needed here
  if (isKiosk) {
    return <>{children}</>;
  }

  // Admin users get no customer navigation (they have their own sidebar)
  if (isAdmin) {
    return <>{children}</>;
  }

  // Default layout for customers only
  return (
    <>
      <TopNavigation />
      <div className="lg:pt-20">
        {children}
      </div>
      <BottomNavigation />
    </>
  );
};

export default AppLayout;
