
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/currency';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/base/Button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, isAdmin, logout } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalMenuItems: 0,
    todayOrders: 0,
    todaySales: 0,
    completedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // If not authenticated or not admin, redirect to login
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const fetchDashboardData = async () => {
    console.log('📊 Admin Dashboard: Starting data fetch...', {
      timestamp: new Date().toISOString()
    });
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Admin Dashboard fetch timeout - setting loading to false', {
        timestamp: new Date().toISOString(),
        duration: '20s'
      });
      setLoading(false);
    }, 20000); // 20 second timeout

    try {
      setLoading(true);

      // Fetch regular orders data directly (connection test skipped for performance)
      console.log('📊 Admin Dashboard: Fetching regular orders...');
      const ordersStartTime = Date.now();
      
      const ordersPromise = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      const ordersTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Orders query timeout')), 10000)
      );
      
      const { data: orders, error: ordersError } = await Promise.race([
        ordersPromise,
        ordersTimeoutPromise
      ]) as any;
      
      const ordersEndTime = Date.now();
      console.log(`📊 Regular orders query took: ${ordersEndTime - ordersStartTime}ms`);

      if (ordersError) throw ordersError;

      // Fetch kiosk orders data with timeout
      console.log('📊 Admin Dashboard: Fetching kiosk orders...');
      const kioskOrdersStartTime = Date.now();
      
      const kioskOrdersPromise = supabase
        .from('kiosk_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      const kioskOrdersTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Kiosk orders query timeout')), 10000)
      );
      
      const { data: kioskOrders, error: kioskOrdersError } = await Promise.race([
        kioskOrdersPromise,
        kioskOrdersTimeoutPromise
      ]) as any;
      
      const kioskOrdersEndTime = Date.now();
      console.log(`📊 Kiosk orders query took: ${kioskOrdersEndTime - kioskOrdersStartTime}ms`);

      if (kioskOrdersError) throw kioskOrdersError;

      // Combine and normalize all orders
      const allOrders = [
        ...(orders || []).map(order => ({
          ...order,
          order_source: order.order_source || 'online'
        })),
        ...(kioskOrders || []).map(order => ({
          ...order,
          order_source: 'kiosk'
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('🛒 Admin Dashboard: Fetched orders data', {
        regularOrders: orders?.length || 0,
        kioskOrders: kioskOrders?.length || 0,
        totalOrders: allOrders.length
      });

      // Fetch food items count
      const { data: foodItems, error: foodItemsError } = await supabase
        .from('food_items')
        .select('id');

      if (foodItemsError) throw foodItemsError;

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = allOrders?.filter(order => 
        new Date(order.created_at) >= today
      ) || [];

      const pendingOrders = allOrders?.filter(order => 
        order.status === 'pending' || order.status === 'preparing'
      ) || [];

      const completedOrders = allOrders?.filter(order => 
        order.status === 'completed'
      ) || [];

      const totalRevenue = allOrders?.reduce((sum, order) => 
        sum + (order.status !== 'cancelled' ? parseFloat(order.total_amount || 0) : 0), 0
      ) || 0;

      const todaySales = todayOrders.reduce((sum, order) => 
        sum + (order.status !== 'cancelled' ? parseFloat(order.total_amount || 0) : 0), 0
      );

      setStats({
        totalOrders: allOrders?.length || 0,
        pendingOrders: pendingOrders.length,
        totalRevenue,
        totalMenuItems: foodItems?.length || 0,
        todayOrders: todayOrders.length,
        todaySales,
        completedOrders: completedOrders.length
      });

      // Set recent orders (last 5)
      setRecentOrders(allOrders?.slice(0, 5) || []);

      // Generate notifications based on recent orders
      const recentNotifications = allOrders?.slice(0, 3).map((order, index) => ({
        id: order.id,
        type: order.status === 'pending' ? 'new_order' : 'order_update',
        message: order.status === 'pending' 
          ? `New order #${order.id.slice(-4)} received`
          : `Order #${order.id.slice(-4)} ${order.status}`,
        time: getTimeAgo(order.created_at),
        unread: index < 2
      })) || [];

      setNotifications(recentNotifications);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      // Always clear loading state and timeout
      clearTimeout(timeoutId);
      setLoading(false);
      console.log('📊 Admin Dashboard: Data fetch completed');
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, unread: false } : notif
    ));
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, unread: false })));
  };

  // Show loading while checking authentication
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const quickActions = [
    {
      title: 'Point of Sale',
      description: 'Process dine-in and walk-in orders',
      icon: 'ri-cash-line',
      path: '/admin/pos',
      color: 'bg-green-500'
    },
    {
      title: 'POS Sales Report',
      description: 'View POS sales analytics',
      icon: 'ri-line-chart-line',
      path: '/admin/pos/sales',
      color: 'bg-indigo-500'
    },
    {
      title: 'Manage Orders',
      description: 'View and update order status',
      icon: 'ri-shopping-bag-line',
      path: '/admin/orders',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Menu',
      description: 'Add, edit, or remove menu items',
      icon: 'ri-restaurant-line',
      path: '/admin/menu',
      color: 'bg-orange-500'
    },
    {
      title: 'View Reports',
      description: 'Sales and performance analytics',
      icon: 'ri-bar-chart-line',
      path: '/admin/reports',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div>
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.full_name || user?.email}</p>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  <i className="ri-notification-line text-xl"></i>
                  {notifications.some(n => n.unread) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {notifications.some(n => n.unread) && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-sm text-orange-600 hover:text-orange-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                              notification.unread ? 'bg-orange-50' : ''
                            }`}
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <div className="flex items-start">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                notification.type === 'new_order' ? 'bg-green-100' : 'bg-blue-100'
                              }`}>
                                <i className={`${
                                  notification.type === 'new_order' ? 'ri-shopping-bag-line text-green-600' : 'ri-refresh-line text-blue-600'
                                } text-sm`}></i>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-600">{notification.time}</p>
                              </div>
                              {notification.unread && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <i className="ri-notification-off-line text-2xl mb-2"></i>
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-200">
                      <button className="w-full text-center text-sm text-orange-600 hover:text-orange-700">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}

                {/* Overlay to close dropdown */}
                {showNotifications && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
        {/* Dashboard Content */}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm p-6 border border-blue-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Today's Orders</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.todayOrders}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    <i className="ri-arrow-up-line"></i>
                    +12% from yesterday
                  </p>
                </div>
                <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="ri-shopping-bag-line text-2xl text-white"></i>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm p-6 border border-green-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Today's Sales</p>
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(stats.todaySales)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    <i className="ri-arrow-up-line"></i>
                    +8% from yesterday
                  </p>
                </div>
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="ri-money-dollar-circle-line text-2xl text-white"></i>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm p-6 border border-orange-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.pendingOrders}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    <i className="ri-time-line mr-1"></i>
                    Needs attention
                  </p>
                </div>
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="ri-time-line text-2xl text-white"></i>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm p-6 border border-purple-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Completed Orders</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.completedOrders}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    <i className="ri-check-line mr-1"></i>
                    All time
                  </p>
                </div>
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="ri-check-line text-2xl text-white"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <i className="ri-flashlight-line text-orange-500 mr-3"></i>
                    Quick Actions
                  </h2>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.path)}
                      className="group p-6 border-2 border-gray-100 rounded-2xl hover:border-orange-200 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <i className={`${action.icon} text-xl text-white`}></i>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-orange-700 transition-colors">{action.title}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{action.description}</p>
                      <div className="mt-4 flex items-center text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-sm font-medium mr-2">Get started</span>
                        <i className="ri-arrow-right-line"></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <i className="ri-history-line text-blue-500 mr-3"></i>
                    Recent Orders
                  </h2>
                  <Button
                    onClick={() => navigate('/admin/orders')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <i className="ri-external-link-line mr-2"></i>
                    View All
                  </Button>
                </div>
                
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Order ID</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Customer</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Status</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Total</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-100">
                            <td className="py-3 px-4">#{order.id.slice(-4)}</td>
                            <td className="py-3 px-4">{order.customer_name}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">{formatCurrency(parseFloat(order.total_amount))}</td>
                            <td className="py-3 px-4">{getTimeAgo(order.created_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          {/* Notifications Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.unread
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      notification.type === 'new_order' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <i className={`${
                        notification.type === 'new_order' ? 'ri-shopping-bag-line text-green-600' : 'ri-refresh-line text-blue-600'
                      } text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-600">{notification.time}</p>
                    </div>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <i className="ri-notification-off-line text-2xl mb-2"></i>
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
