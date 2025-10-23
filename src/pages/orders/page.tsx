
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import Button from '../../components/base/Button';

const Orders = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { fetchUserOrders } = useOrders();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    // Don't redirect if still loading auth state
    if (isLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch real orders from database
    const loadUserOrders = async () => {
      try {
        setOrdersLoading(true);
        const userOrders = await fetchUserOrders(user.id);
        setOrders(userOrders);
      } catch (error) {
        console.error('Error loading user orders:', error);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    loadUserOrders();
  }, [user, navigate, isLoading, fetchUserOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'preparing':
        return 'text-blue-600 bg-blue-100';
      case 'ready':
        return 'text-purple-600 bg-purple-100';
      case 'out_for_delivery':
        return 'text-purple-600 bg-purple-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Show loading spinner while checking auth
  if (isLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 lg:pb-8">
      {/* Enhanced Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="lg:hidden w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 mr-4"
              >
                <i className="ri-arrow-left-line text-xl text-orange-600" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-600">
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <Button
                onClick={() => navigate('/menu')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <i className="ri-restaurant-line mr-2" />
                Browse Menu
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-orange-100">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-shopping-bag-line text-3xl text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">Start your culinary journey by exploring our delicious menu!</p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/menu')} 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center">
                  <i className="ri-restaurant-line mr-2" />
                  Browse Menu
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">Order #{order.id.slice(-4)}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      order.status === 'completed' ? 'bg-green-500' :
                      order.status === 'cancelled' ? 'bg-red-500' :
                      'bg-orange-500 animate-pulse'
                    }`} />
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.order_items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0">
                        <img
                          src={item.food_items?.image_url || `https://readdy.ai/api/search-image?query=delicious%20food%20dish%20restaurant%20meal%20appetizing%20colorful%20fresh%20ingredients%20beautifully%20plated%20gourmet%20cuisine%20culinary%20art&width=200&height=200&seq=food-placeholder&orientation=squarish`}
                          alt={item.food_items?.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{item.food_items?.name || 'Unknown Item'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{item.quantity}x</span>
                          <span>{formatCurrency(item.unit_price)}</span>
                          <span className="text-gray-400">•</span>
                          <span>{formatCurrency(item.total_price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(order.total_amount)}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <i className={order.order_type === 'delivery' ? 'ri-truck-line' : 'ri-store-2-line'} />
                      <span className="capitalize">{order.order_type}</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <i className="ri-eye-line mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
