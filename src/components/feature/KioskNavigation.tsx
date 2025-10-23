import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

const KioskNavigation: React.FC = () => {
  const { logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { path: '/kiosk', label: 'Home', icon: '🏠' },
    { path: '/kiosk/menu', label: 'Menu', icon: '🍽️' },
    { path: '/kiosk/cart', label: `Cart${cartItemCount > 0 ? ` (${cartItemCount})` : ''}`, icon: '🛒' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-600">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-blue-600">
              🍽️ Food Kiosk
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-red-600 transition-colors"
          >
            🚪 Exit
          </button>
        </div>
      </div>
    </nav>
  );
};

export default KioskNavigation;