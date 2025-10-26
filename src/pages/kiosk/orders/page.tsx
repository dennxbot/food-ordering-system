import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency } from '../../../utils/currency';
import type { KioskOrderWithItems } from '../../../lib/supabase-types';

const KioskOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<KioskOrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Phase 1: Fresh data loading on route change
  useEffect(() => {
    // Refresh data when route changes (fresh page reload)
    console.log('Kiosk Orders: Fresh data load on route change');
    fetchOrders();
  }, [location.pathname]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Fetch recent kiosk orders (last 20) for kiosk display
      const { data: ordersData, error } = await supabase
        .from('kiosk_orders')
        .select(`
          *,
          kiosk_order_items (
            id,
            quantity,
            unit_price,
            food_items (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching kiosk orders:', error);
        setOrders([]);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching kiosk orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, orderSource?: string) => {
    // For kiosk orders, show different labels
    if (orderSource === 'kiosk') {
      switch (status) {
        case 'pending':
          return 'Awaiting Approval';
        case 'preparing':
          return 'Order Approved';
        case 'ready':
          return 'Order Approved';
        case 'completed':
          return 'Completed';
        case 'cancelled':
          return 'Cancelled';
        default:
          return status.replace('_', ' ');
      }
    }
    
    // For regular orders, use standard labels
    return status.replace('_', ' ');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Order History</h1>
              <p className="text-xl text-gray-600 mt-2">Recent orders from the system</p>
            </div>
            <button
              onClick={() => navigate('/kiosk')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <i className="ri-arrow-left-line"></i>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Order #{order.id.slice(-4)}
                    </h3>
                    <p className="text-gray-600 text-lg">
                      {order.customer_name} • {getTimeAgo(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status, 'kiosk')}
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Items */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="ri-restaurant-line text-orange-500"></i>
                      Order Items
                    </h4>
                    <div className="space-y-2">
                      {order.kiosk_order_items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.food_items?.name}</span>
                          <span className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="ri-user-line text-blue-500"></i>
                      Customer
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {order.customer_name}</p>
                      <p><strong>Phone:</strong> {order.customer_phone}</p>
                      <p><strong>Email:</strong> {order.customer_email}</p>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="ri-information-line text-green-500"></i>
                      Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Type:</strong> {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                      <p><strong>Payment:</strong> {order.payment_method === 'cash' ? 'Cash' : 'Card'}</p>
                      <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {new Date(order.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600 text-lg">There are no recent orders to display.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Showing recent orders • Need help? Ask a staff member
          </p>
        </div>
      </div>
    </div>
  );
};

export default KioskOrdersPage;