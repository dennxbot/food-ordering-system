import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import { supabase } from '../../lib/supabase';

interface OrderItem {
  id: string;
  food_item_id: string;
  size_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  food_items: {
    name: string;
    image_url?: string;
  };
  item_sizes?: {
    name: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  order_type: 'delivery' | 'pickup';
  payment_method: 'cash' | 'card';
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      console.log('🔍 Starting to fetch order with ID:', id);
      try {
        // First, check if the order exists
        const { data: basicOrder, error: basicError } = await supabase
          .from('orders')
          .select('id')
          .eq('id', id)
          .single();

        if (basicError) {
          console.error('❌ Error checking order existence:', basicError);
          throw basicError;
        }

        if (!basicOrder) {
          console.error('❌ Order not found in initial check');
          throw new Error('Order not found');
        }

        console.log('✅ Order exists, fetching complete details...');

        // Fetch complete order with items in a single query
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              food_item_id,
              size_id,
              quantity,
              unit_price,
              food_items (
                id,
                name,
                image_url,
                description
              ),
              item_sizes (
                id,
                name,
                price
              )
            )
          `)
          .eq('id', id)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors

        console.log('📦 Complete order data:', orderData);

        if (orderError) {
          console.error('❌ Error fetching complete order:', orderError);
          throw orderError;
        }

        if (!orderData) {
          console.error('❌ Complete order data not found');
          throw new Error('Order details not found');
        }

        if (!orderData.order_items || orderData.order_items.length === 0) {
          console.log('⚠️ Order exists but has no items yet, waiting 1 second and retrying...');
          // Wait a second and try again
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchOrder();
        }

        console.log('✅ Setting complete order data:', orderData);
        setOrder(orderData);
      } catch (error: any) {
        console.error('Error fetching order:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    let retryCount = 0;
    const maxRetries = 5;

    const attemptFetch = async () => {
      if (!id) return;

      try {
        await fetchOrder();
      } catch (error) {
        console.error(`❌ Attempt ${retryCount + 1}/${maxRetries} failed:`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying in ${retryCount}s...`);
          setTimeout(attemptFetch, retryCount * 1000);
        } else {
          console.error('❌ Max retries reached');
          setIsLoading(false);
          setOrder(null);
        }
      }
    };

    if (id) {
      attemptFetch();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-error-warning-line text-3xl text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Order not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const estimatedTime = order.order_type === 'delivery' ? '45-60 minutes' : '20-30 minutes';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 lg:pb-8">
      {/* Enhanced Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/orders')}
                className="lg:hidden w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 mr-4"
              >
                <i className="ri-arrow-left-line text-xl text-orange-600" />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Order Confirmed!</h1>
                <p className="text-sm text-gray-600">Order #{order.id.slice(-8)}</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <Button
                onClick={() => navigate('/orders')}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <i className="ri-file-list-3-line mr-2" />
                View All Orders
              </Button>
              <Button
                onClick={() => navigate('/menu')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <i className="ri-restaurant-line mr-2" />
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Order Details and Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h2>
              <p className="text-green-700">Thank you for your order. We'll prepare it with care.</p>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Items</h3>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0">
                      <img
                        src={item.food_items?.image_url || `https://readdy.ai/api/search-image?query=delicious%20food%20dish%20restaurant%20meal%20appetizing%20colorful%20fresh%20ingredients%20beautifully%20plated%20gourmet%20cuisine%20culinary%20art&width=200&height=200&seq=food-placeholder&orientation=squarish`}
                        alt={item.food_items?.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{item.food_items.name}</h4>
                      <div className="mt-1 space-y-1">
                        {item.item_sizes && (
                          <p className="text-sm text-gray-500">Size: {item.item_sizes.name}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${(item.quantity * item.unit_price).toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span>$2.99</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">${(order.total_amount + 2.99).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="ri-time-line text-2xl text-blue-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-lg">Estimated {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'} Time</h4>
                  <p className="text-blue-800 mt-1">{estimatedTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Details and Customer Info */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Order Details Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Order Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-file-list-3-line text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-medium text-gray-900">#{order.id.slice(-8)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-calendar-line text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-truck-line text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Method</p>
                      <p className="font-medium text-gray-900 capitalize">{order.order_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-bank-card-line text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {order.payment_method === 'cash' ? 
                          (order.order_type === 'delivery' ? 'Cash on Delivery' : 'Pay on Pickup') : 
                          order.payment_method}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Customer Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-user-line text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-phone-line text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium text-gray-900">{order.customer_phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-map-pin-line text-orange-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900">{order.customer_address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden space-y-3 mt-6">
          <Button
            onClick={() => navigate('/orders')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold whitespace-nowrap"
          >
            View My Orders
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 py-3 rounded-lg font-semibold whitespace-nowrap"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
