
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/currency';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/base/Button';
import AdminSidebar from '../../../components/feature/AdminSidebar';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  order_type: string;
  payment_method: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  order_source?: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    size_id?: string;
    food_item: {
      name: string;
    };
    item_sizes?: {
      name: string;
    };
  }[];
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // If not authenticated or not admin, redirect to login
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, isAdmin, isLoading, navigate, sourceFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            size_id,
            food_item:food_items (
              name
            ),
            item_sizes (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply source filter if not 'all'
      if (sourceFilter !== 'all') {
        query = query.eq('order_source', sourceFilter);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  const cancelOrderWithReason = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    try {
      setCancelLoading(true);
      
      // Call the cancel_order function with reason
      const { error } = await supabase.rpc('cancel_order', {
        p_order_id: selectedOrderId,
        p_reason: cancelReason,
        p_cancelled_by: user?.id
      });

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order =>
        order.id === selectedOrderId ? { ...order, status: 'cancelled' } : order
      ));

      // Close modal and reset state
      setShowCancelModal(false);
      setSelectedOrderId('');
      setCancelReason('');
      
      alert('Order cancelled successfully.');
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      alert(error.message || 'Error cancelling order. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getNextStatus = (currentStatus: string, orderType: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return orderType === 'delivery' ? 'out_for_delivery' : 'ready';
      case 'ready':
        return 'completed';
      case 'out_for_delivery':
        return 'completed';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string, orderType: string, orderSource?: string) => {
    switch (currentStatus) {
      case 'pending':
        // For kiosk orders, show "Approve" instead of "Start Preparing"
        return orderSource === 'kiosk' ? 'Approve' : 'Start Preparing';
      case 'preparing':
        return orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup';
      case 'ready':
        return 'Mark Completed';
      case 'out_for_delivery':
        return 'Mark Delivered';
      default:
        return null;
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(order => order.status === filter);

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600">Manage all customer orders</p>
          </div>
        </div>

        <div className="p-6">
          {/* Order Source Filter Tabs */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Source</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Sources', icon: 'ri-global-line' },
                { key: 'online', label: 'Online Orders', icon: 'ri-computer-line' },
                { key: 'kiosk', label: 'Kiosk Orders', icon: 'ri-store-2-line' },
                { key: 'pos', label: 'POS Orders', icon: 'ri-cash-line' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSourceFilter(tab.key)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    sourceFilter === tab.key
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Orders', icon: 'ri-list-check', count: orders.length },
                { key: 'pending', label: 'Pending', icon: 'ri-time-line', count: orders.filter(o => o.status === 'pending').length },
                { key: 'preparing', label: 'Preparing', icon: 'ri-restaurant-line', count: orders.filter(o => o.status === 'preparing').length },
                { key: 'ready', label: 'Ready', icon: 'ri-check-line', count: orders.filter(o => o.status === 'ready').length },
                { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'ri-truck-line', count: orders.filter(o => o.status === 'out_for_delivery').length },
                { key: 'completed', label: 'Completed', icon: 'ri-check-double-line', count: orders.filter(o => o.status === 'completed').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    filter === tab.key
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    filter === tab.key 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-shopping-bag-line text-3xl text-gray-400"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No orders found</h3>
                <p className="text-gray-600 mb-6">No orders match the selected filter.</p>
                <button
                  onClick={() => setFilter('all')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg"
                >
                  View All Orders
                </button>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1">
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <i className="ri-shopping-bag-line text-xl text-white"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h3>
                              {/* Order Source Badge */}
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                order.order_source === 'kiosk' 
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : order.order_source === 'pos'
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {order.order_source === 'kiosk' && <i className="ri-store-2-line mr-1"></i>}
                                {order.order_source === 'pos' && <i className="ri-cash-line mr-1"></i>}
                                {order.order_source === 'online' && <i className="ri-computer-line mr-1"></i>}
                                {order.order_source || 'online'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <i className="ri-user-line"></i>
                              {order.customer_name} • {getTimeAgo(order.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold capitalize flex items-center gap-2 ${getStatusColor(order.status)}`}>
                            <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                            {order.status.replace('-', ' ')}
                          </span>
                          <span className="text-2xl font-bold text-orange-600">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </div>

                      {/* Order Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Items */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <i className="ri-restaurant-line text-orange-500"></i>
                            Order Items
                          </h4>
                          <div className="space-y-2">
                            {order.order_items?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                  {item.quantity}x {item.food_item?.name || 'Unknown Item'}
                                  {item.item_sizes?.name && (
                                    <span className="text-gray-500 ml-1">({item.item_sizes.name})</span>
                                  )}
                                </span>
                                <span className="font-semibold text-gray-900">{formatCurrency(item.unit_price * item.quantity)}</span>
                              </div>
                            )) || <p className="text-sm text-gray-500">No items found</p>}
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <i className="ri-user-line text-blue-500"></i>
                            Customer Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <i className="ri-phone-line text-gray-400"></i>
                              <span className="text-gray-700">{order.customer_phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="ri-mail-line text-gray-400"></i>
                              <span className="text-gray-700">{order.customer_email}</span>
                            </div>
                            {order.customer_address && (
                              <div className="flex items-start gap-2">
                                <i className="ri-map-pin-line text-gray-400 mt-0.5"></i>
                                <span className="text-gray-700">{order.customer_address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <i className="ri-information-line text-green-500"></i>
                            Order Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            {order.order_source === 'kiosk' ? (
                              <div className="flex items-center gap-2">
                                <i className="ri-store-2-line text-gray-400"></i>
                                <span className="text-gray-700">Kiosk Order</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <i className="ri-truck-line text-gray-400"></i>
                                  <span className="text-gray-700 capitalize">{order.order_type || 'pickup'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <i className="ri-bank-card-line text-gray-400"></i>
                                  <span className="text-gray-700 capitalize">
                                    {order.payment_method === 'cash' ?
                                      (order.order_type === 'delivery' ? 'Cash on Delivery' : 'Pay on Pickup') :
                                      order.payment_method || 'Cash'}
                                  </span>
                                </div>
                              </>
                            )}
                            {order.notes && (
                              <div className="flex items-start gap-2">
                                <i className="ri-sticky-note-line text-gray-400 mt-0.5"></i>
                                <span className="text-gray-700">{order.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <div className="flex flex-col gap-3 lg:min-w-[200px]">
                        {getNextStatus(order.status, order.order_type) && (
                          <Button
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status, order.order_type)!)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                          >
                            <i className="ri-arrow-right-line"></i>
                            {getNextStatusLabel(order.status, order.order_type, order.order_source)}
                          </Button>
                        )}
                        
                        {order.status === 'pending' && (
                          <Button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setShowCancelModal(true);
                            }}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                          >
                            <i className="ri-close-line"></i>
                            {order.order_source === 'kiosk' ? 'Cancel' : 'Cancel Order'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-close-circle-line text-red-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cancel Order</h3>
            </div>
            
            {(() => {
              const selectedOrder = orders.find(order => order.id === selectedOrderId);
              const isKioskOrder = selectedOrder?.order_source === 'kiosk';
              
              return (
                <p className="text-gray-600 mb-4">
                  {isKioskOrder 
                    ? "Please provide a reason for cancelling this kiosk order. Common reasons include no payment received or order placed by mistake."
                    : "Please provide a reason for cancelling this order. This will be visible to the customer."
                  }
                </p>
              );
            })()}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={(() => {
                  const selectedOrder = orders.find(order => order.id === selectedOrderId);
                  const isKioskOrder = selectedOrder?.order_source === 'kiosk';
                  return isKioskOrder 
                    ? "e.g., No payment received, Order placed by mistake..."
                    : "Enter reason for cancellation...";
                })()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
                disabled={cancelLoading}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrderId('');
                  setCancelReason('');
                }}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={cancelOrderWithReason}
                disabled={cancelLoading || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <i className="ri-close-line"></i>
                    Cancel Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
