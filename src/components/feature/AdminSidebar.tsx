
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, resetAuth } = useAuth();

  const menuItems = [
    {
      icon: 'ri-dashboard-line',
      label: 'Dashboard',
      path: '/admin',
      active: location.pathname === '/admin'
    },
    {
      icon: 'ri-shopping-bag-line',
      label: 'Orders',
      path: '/admin/orders',
      active: location.pathname === '/admin/orders'
    },
    {
      icon: 'ri-restaurant-line',
      label: 'Menu',
      path: '/admin/menu',
      active: location.pathname === '/admin/menu'
    },
    {
      icon: 'ri-folder-line',
      label: 'Categories',
      path: '/admin/categories',
      active: location.pathname === '/admin/categories'
    },
    {
      icon: 'ri-user-line',
      label: 'Customers',
      path: '/admin/customers',
      active: location.pathname === '/admin/customers'
    },
    {
      icon: 'ri-bar-chart-line',
      label: 'Reports',
      path: '/admin/reports',
      active: location.pathname === '/admin/reports'
    },
    {
      icon: 'ri-settings-line',
      label: 'Account Settings',
      path: '/admin/settings',
      active: location.pathname === '/admin/settings'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetAuth = () => {
    resetAuth();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🍽️</span>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                  item.active
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`${item.icon} text-lg mr-3`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={handleResetAuth}
          className="w-full flex items-center px-4 py-2 rounded-lg text-left text-orange-600 hover:bg-orange-50 transition-colors text-sm"
        >
          <i className="ri-refresh-line text-lg mr-3"></i>
          <span className="font-medium">Reset Data</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <i className="ri-logout-box-line text-lg mr-3"></i>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
