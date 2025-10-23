
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      icon: 'ri-dashboard-line',
      label: 'Dashboard',
      path: '/admin',
      active: location.pathname === '/admin'
    },
    {
      icon: 'ri-cash-line',
      label: 'POS',
      path: '/admin/pos',
      active: location.pathname === '/admin/pos'
    },
    {
      icon: 'ri-line-chart-line',
      label: 'POS Sales',
      path: '/admin/pos/sales',
      active: location.pathname === '/admin/pos/sales'
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
    navigate('/admin/login');
  };

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
            <i className="ri-restaurant-line text-xl text-orange-600"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: '"Pacifico", serif' }}>
              logo
            </h1>
            <p className="text-xs text-gray-600">Admin Panel</p>
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

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
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
