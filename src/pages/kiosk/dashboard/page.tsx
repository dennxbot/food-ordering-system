import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useKioskCart } from '../../../hooks/useKioskCart';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../../components/base/Button';
import { formatCurrency } from '../../../utils/currency';

const KioskDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, isAuthenticated, isKiosk } = useAuth();
  const { items, total, clearCart } = useKioskCart();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // If not authenticated or not kiosk, redirect to login
    if (!isAuthenticated || !isKiosk) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, isKiosk, isLoading, navigate]);

  // Phase 1: Fresh data loading on route change
  useEffect(() => {
    // Refresh data when route changes (fresh page reload)
    if (isAuthenticated && isKiosk) {
      // Force refresh of cart data and any other dashboard data
      console.log('Kiosk Dashboard: Fresh data load on route change');
    }
  }, [location.pathname, isAuthenticated, isKiosk]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not kiosk
  if (!isAuthenticated || !isKiosk) {
    return null;
  }

  const quickActions = [
    {
      title: 'Browse Menu',
      description: 'View available food items',
      icon: 'ri-restaurant-line',
      path: '/kiosk/menu',
      color: 'bg-orange-500'
    },
    {
      title: 'View Cart',
      description: `${items.length} items - ${formatCurrency(total)}`,
      icon: 'ri-shopping-cart-line',
      path: '/kiosk/cart',
      color: 'bg-blue-500'
    },
    {
      title: 'Order History',
      description: 'View recent orders',
      icon: 'ri-history-line',
      path: '/kiosk/orders',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kiosk Terminal</h1>
              <p className="text-gray-600">Welcome to the self-service ordering system</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-sm text-gray-600">
                {currentTime.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="text-center">
            <i className="ri-restaurant-2-line text-6xl mb-4"></i>
            <h2 className="text-3xl font-bold mb-2">Welcome to Our Restaurant</h2>
            <p className="text-xl opacity-90">Touch anywhere to start your order</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="text-center">
                <div className={`${action.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <i className={`${action.icon} text-2xl text-white`}></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600">{action.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Current Cart Summary */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Current Order</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Clear Cart
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.slice(0, 3).map((item) => (
                <div key={`${item.id}-${item.size_id || 'default'}`} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.size_name || 'Regular'} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency((item.price + (item.size_price || 0)) * item.quantity)}
                  </p>
                </div>
              ))}
              
              {items.length > 3 && (
                <p className="text-sm text-gray-600 text-center py-2">
                  +{items.length - 3} more items
                </p>
              )}
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <p className="text-lg font-bold text-gray-900">Total:</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(total)}</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => navigate('/kiosk/cart')}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Review Order
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Need help? Please ask a staff member for assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default KioskDashboard;