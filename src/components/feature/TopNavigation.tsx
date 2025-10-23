import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

export default function TopNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();

  const totalItems = items.length; // Count unique items, not total quantity

  const navItems = [
    { path: '/', icon: 'ri-home-line', activeIcon: 'ri-home-fill', label: 'Home' },
    { path: '/menu', icon: 'ri-restaurant-line', activeIcon: 'ri-restaurant-fill', label: 'Menu' },
    { path: '/cart', icon: 'ri-shopping-cart-line', activeIcon: 'ri-shopping-cart-fill', label: 'Cart', badge: totalItems },
    { path: '/orders', icon: 'ri-file-list-3-line', activeIcon: 'ri-file-list-3-fill', label: 'Orders' },
    { path: '/profile', icon: 'ri-user-line', activeIcon: 'ri-user-fill', label: 'Profile' },
  ];

  return (
    <div className="hidden lg:block fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-orange-100 px-4 py-2 z-50 shadow-lg">
      <div className="flex justify-center items-center max-w-4xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center py-3 px-6 rounded-2xl transition-all duration-300 cursor-pointer transform mx-2 ${
                isActive
                  ? 'text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-lg scale-105'
                  : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
              }`}
            >
              <div className="relative">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className={`${isActive ? item.activeIcon : item.icon} text-xl`} />
                </div>
                {item.path === '/cart' && totalItems > 0 && (
                  <span className={`absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                    isActive 
                      ? 'bg-white text-orange-500' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                  }`}>
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className={`ml-2 font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}