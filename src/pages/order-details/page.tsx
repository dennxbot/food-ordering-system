
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import { formatCurrency } from '../../utils/currency';
import { isWithinCancellationWindow, isStatusCancellable, getCancellationTimeRemaining } from '../../utils/orderHelpers';
import { supabase } from '../../lib/supabase';

const CANCELLATION_REASONS = [
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'wrong_order', label: 'Ordered wrong items' },
  { value: 'long_wait', label: 'Wait time too long' },
  { value: 'duplicate', label: 'Duplicate order' },
  { value: 'other', label: 'Other reason' },
  // Admin-specific reasons
  { value: 'no_payment', label: 'No payment received' },
  { value: 'order_mistake', label: 'Order placed by mistake' },
  { value: 'item_unavailable', label: 'Item unavailable' },
  { value: 'customer_request', label: 'Customer requested cancellation' },
  { value: 'system_error', label: 'System error' }
];

// Helper function to get readable cancellation reason
const getCancellationReasonLabel = (reason: string) => {
  const reasonObj = CANCELLATION_REASONS.find(r => r.value === reason);
  return reasonObj ? reasonObj.label : reason;
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { getOrderById, cancelOrder } = useOrders();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancellationInfo, setCancellationInfo] = useState<any>(null);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (authLoading) return;

    // Only redirect if auth is done loading and there's no user
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    // Don't load if we already have the order data
    if (order && order.id === id) return;

    const loadOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const orderData = await getOrderById(id);
        setOrder(orderData);
        
        // If order is cancelled, fetch cancellation info
        if (orderData?.status === 'cancelled') {
          try {
            // Set user context for RLS before querying cancellation data
            if (user) {
              await supabase.rpc('set_user_context', { 
                user_id: user.id, 
                user_role: user.role 
              });
            }
            
            const { data: cancellationData, error: cancellationError } = await supabase
              .from('order_cancellations')
              .select('reason, created_at, cancelled_by')
              .eq('order_id', id)
              .single();
              
            if (!cancellationError && cancellationData) {
              setCancellationInfo(cancellationData);
            } else if (cancellationError) {
              console.warn('Could not fetch cancellation info:', cancellationError);
            }
          } catch (cancellationFetchError) {
            console.warn('Error fetching cancellation info:', cancellationFetchError);
          }
        }
      } catch (error) {
        console.error('Error loading order:', error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, user?.id, authLoading, navigate, getOrderById, order]);

  const getStatusSteps = () => {
    // For cancelled orders, show a simplified status flow
    if (order?.status === 'cancelled') {
      return [
        { 
          key: 'pending', 
          label: 'Order Placed', 
          icon: 'ri-check-line',
          completed: true,
          active: false
        },
        { 
          key: 'cancelled', 
          label: 'Order Cancelled', 
          icon: 'ri-close-circle-line',
          completed: true,
          active: true
        }
      ];
    }

    // For active orders, show the full status flow
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: 'ri-check-line' },
      { key: 'preparing', label: 'Preparing', icon: 'ri-restaurant-line' },
      { key: 'ready', label: order?.order_type === 'delivery' ? 'Ready for Delivery' : 'Ready for Pickup', icon: order?.order_type === 'delivery' ? 'ri-truck-line' : 'ri-store-line' },
      { key: 'out_for_delivery', label: order?.order_type === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup', icon: order?.order_type === 'delivery' ? 'ri-truck-line' : 'ri-store-line' },
      { key: 'completed', label: 'Completed', icon: 'ri-check-double-line' }
    ];

    const statusOrder = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];
    let currentIndex = statusOrder.indexOf(order?.status || 'pending');
    
    // Note: We allow the order status to show the actual database status
    // even for unpaid cash orders, as admin may manually update status
    // Payment requirements are shown separately in the UI

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="ri-file-list-3-line text-orange-500 text-xl"></i>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Order Details</h2>
          <p className="text-gray-600">Please wait while we fetch your order information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Order not found</h2>
          <button 
            onClick={() => navigate('/orders')}
            className="text-orange-600 hover:text-orange-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 lg:pb-8">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
          <i className="ri-checkbox-circle-line text-xl mr-2"></i>
          <span>{toastMessage}</span>
          <button 
            onClick={() => setShowSuccessToast(false)}
            className="ml-4 text-green-700 hover:text-green-900"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
          <i className="ri-error-warning-line text-xl mr-2"></i>
          <span>{toastMessage}</span>
          <button 
            onClick={() => setShowErrorToast(false)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}
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
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-sm text-gray-600">Order #{order.id.slice(-4)}</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={() => navigate('/orders')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <i className="ri-arrow-left-line" />
                Back to Orders
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Order Info and Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-4">
            <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">Order #{order.id.slice(-4)}</h2>
            <span className="px-3 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100 capitalize">
              {order.status.replace('_', ' ')}
            </span>
                  </div>
                  <p className="text-gray-600">
                    Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(order.total_amount)}</p>
                </div>
          </div>
        </div>

        {/* Status Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status</h3>
              
              {/* Cancellation Notice */}
              {order.status === 'cancelled' && cancellationInfo && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-close-circle-line text-red-600"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">Order Cancelled</h4>
                      <p className="text-red-800 text-sm mb-2">
                        <strong>Reason:</strong> {getCancellationReasonLabel(cancellationInfo.reason)}
                      </p>
                      <p className="text-red-700 text-xs">
                        Cancelled on {new Date(cancellationInfo.created_at).toLocaleDateString()} at {new Date(cancellationInfo.created_at).toLocaleTimeString()}
                        {cancellationInfo.cancelled_by && (
                          <span className="ml-2">
                            • {cancellationInfo.cancelled_by === order?.user_id ? 'Cancelled by you' : 'Cancelled by admin'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Notice - Show for cancelled orders */}
              {order.status === 'cancelled' && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-information-line text-gray-600"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Order Cancelled</h4>
                      <p className="text-gray-700 text-sm">
                        This order has been cancelled. No payment is required and the order will not be prepared.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Pending Notice - Don't show for cancelled orders */}
              {order.payment_status === 'pending' && order.payment_method === 'cash' && order.status !== 'cancelled' && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="ri-time-line text-yellow-600"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">
                        {order.status === 'ready' ? 'Ready for Pickup - Payment Required' : 'Payment Pending'}
                      </h4>
                      <p className="text-yellow-800 text-sm">
                        {order.order_type === 'pickup' 
                          ? (order.status === 'ready' 
                              ? 'Your order is ready! Please bring cash payment when you arrive.'
                              : 'Please bring cash payment when you pick up your order.')
                          : 'Payment will be collected upon delivery.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {statusSteps.map((step) => (
              <div key={step.key} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shadow-md ${
                  step.completed ? 'bg-green-500 text-white' : 
                  step.active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                      <i className={`${step.icon} text-lg`}></i>
                </div>
                <div className="flex-1">
                      <p className={`font-semibold text-base ${step.completed || step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {/* Show payment requirement for unpaid cash orders (but not for cancelled orders) */}
                  {order?.payment_method === 'cash' && order?.payment_status === 'pending' && order?.status !== 'cancelled' && (
                    <p className="text-sm text-amber-600 mt-1">
                      <i className="ri-money-dollar-circle-line mr-1"></i>
                      {step.key === 'pending' ? 'Payment required before order can proceed' :
                       step.key === 'ready' ? 'Payment required for pickup' :
                       'Payment still pending'}
                    </p>
                  )}
                </div>
                {step.completed && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="ri-check-line text-green-600"></i>
                      </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Order Items</h3>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0">
                      <img
                        src={item.food_items?.image_url || `https://readdy.ai/api/search-image?query=delicious%20food%20dish%20restaurant%20meal%20appetizing%20colorful%20fresh%20ingredients%20beautifully%20plated%20gourmet%20cuisine%20culinary%20art&width=200&height=200&seq=food-placeholder&orientation=squarish`}
                        alt={item.food_items?.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{item.food_items?.name || 'Unknown Item'}</h4>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-600">Unit Price: {formatCurrency(item.unit_price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(item.quantity * item.unit_price)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-6 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(2.99)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">{formatCurrency(order.total_amount + 2.99)}</span>
                  </div>
                </div>
            </div>
          </div>
        </div>

          {/* Right Column - Customer Info and Help */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
        {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
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

            {order.customer_phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-phone-line text-orange-600"></i>
                      </div>
              <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium text-gray-900">{order.customer_phone}</p>
                      </div>
              </div>
            )}

            {order.customer_email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-mail-line text-orange-600"></i>
                      </div>
              <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{order.customer_email}</p>
                      </div>
              </div>
            )}

            {order.customer_address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-map-pin-line text-orange-600"></i>
                      </div>
              <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{order.customer_address}</p>
                      </div>
              </div>
            )}

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

                  {/* Payment Status - Don't show for cancelled orders */}
                  {order.payment_status && order.status !== 'cancelled' && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        order.payment_status === 'paid' ? 'bg-green-100' :
                        order.payment_status === 'pending' ? 'bg-yellow-100' :
                        order.payment_status === 'failed' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        <i className={`${
                          order.payment_status === 'paid' ? 'ri-check-line text-green-600' :
                          order.payment_status === 'pending' ? 'ri-time-line text-yellow-600' :
                          order.payment_status === 'failed' ? 'ri-close-line text-red-600' :
                          'ri-question-line text-gray-600'
                        }`}></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Status</p>
                        <p className={`font-medium capitalize ${
                          order.payment_status === 'paid' ? 'text-green-900' :
                          order.payment_status === 'pending' ? 'text-yellow-900' :
                          order.payment_status === 'failed' ? 'text-red-900' :
                          'text-gray-900'
                        }`}>
                          {order.payment_status === 'paid' ? 'Paid' :
                           order.payment_status === 'pending' ? 'Payment Pending' :
                           order.payment_status === 'failed' ? 'Payment Failed' :
                           order.payment_status}
                        </p>
                      </div>
                    </div>
                  )}
        </div>

              {/* Order Actions */}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="space-y-4">
                  {/* Cancel Order Card */}
                  {(user?.role === 'admin' || (isWithinCancellationWindow(order.created_at) && isStatusCancellable(order.status))) && (
                    <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="ri-close-circle-line text-2xl text-red-600"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 text-lg">Cancel Order</h4>
                          {user?.role !== 'admin' && (
                            <p className="text-red-800 mt-1">
                              Time remaining: {getCancellationTimeRemaining(order.created_at)}
                            </p>
                          )}
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Cancel Order
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Instructions Card - Show for Pay on Pickup orders (but not for cancelled orders) */}
                  {order.payment_method === 'cash' && order.payment_status === 'pending' && order.order_type === 'pickup' && order.status !== 'cancelled' && (
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="ri-money-dollar-circle-line text-2xl text-amber-600"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-900 text-lg">
                            {order.status === 'ready' ? 'Ready for Pickup - Payment Required' : 'Payment Required on Pickup'}
                          </h4>
                          <p className="text-amber-800 mt-1">
                            Please bring <strong>{formatCurrency(order.total_amount)}</strong> in cash when you come to pick up your order.
                          </p>
                          <p className="text-amber-700 text-sm mt-2">
                            {order.status === 'ready' 
                              ? 'Your order is ready! Please bring payment when you arrive.'
                              : 'Your order will be ready for pickup once payment is received.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Status Info Card - Show when order is preparing and can't be cancelled */}
                  {order.status === 'preparing' && user?.role !== 'admin' && (
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="ri-chef-hat-line text-2xl text-blue-600"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 text-lg">Kitchen is Preparing Your Order</h4>
                          <p className="text-blue-800 mt-1">
                            Your order is now being prepared by our kitchen team. Cancellation is no longer available as we've already started cooking your food.
                          </p>
                          <p className="text-blue-700 text-sm mt-2">
                            If you have any concerns, please contact us directly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Help Card */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-customer-service-2-line text-2xl text-orange-600"></i>
                      </div>
              <div>
                        <h4 className="font-semibold text-orange-900 text-lg">Need Help?</h4>
                        <p className="text-orange-800 mt-1">Contact our support team for assistance with your order.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Modal */}
              {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
                    {cancelError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {cancelError}
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Cancellation
                      </label>
                      <select
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select a reason</option>
                        {CANCELLATION_REASONS.map(reason => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowCancelModal(false);
                          setCancelReason('');
                          setCancelError('');
                        }}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        disabled={cancelLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!cancelReason) {
                            setCancelError('Please select a reason for cancellation');
                            return;
                          }
                          
                          try {
                            setCancelLoading(true);
                            setCancelError('');
                            await cancelOrder(order.id, cancelReason);
                            setShowCancelModal(false);
                            setCancelReason('');
                            setToastMessage('Order cancelled successfully');
                            setShowSuccessToast(true);
                            setTimeout(() => setShowSuccessToast(false), 5000); // Hide after 5 seconds
                            
                            // Reload the page to show updated order status
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000); // Small delay to show the success message
                          } catch (error: any) {
                            const errorMsg = error.message || 'Failed to cancel order';
                            setCancelError(errorMsg);
                            setToastMessage(errorMsg);
                            setShowErrorToast(true);
                            setTimeout(() => setShowErrorToast(false), 5000); // Hide after 5 seconds
                          } finally {
                            setCancelLoading(false);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        disabled={cancelLoading || !cancelReason}
                      >
                        {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                      </button>
              </div>
            </div>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
