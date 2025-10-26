import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/currency';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';

export default function Checkout() {
  const navigate = useNavigate();
  const { items: cartItems, getTotalPrice, createOrder } = useCart();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    contactNumber: user?.phone || '',
    address: user?.address || '',
    deliveryMethod: 'delivery',
    paymentMethod: 'cash'
  });

  // Update form data when user data becomes available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        contactNumber: user.phone || prev.contactNumber,
        address: user.address || prev.address
      }));
    }
  }, [user]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async () => {
    if (!formData.fullName || !formData.contactNumber || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }

    if (!user) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Creating order with data:', {
        customerName: formData.fullName,
        customerEmail: user.email || '',
        customerPhone: formData.contactNumber,
        customerAddress: formData.address,
        orderType: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        userId: user.id,
      });

      // Validate user data before creating order
      if (!user || !user.id) {
        throw new Error('User not authenticated or user ID is missing');
      }

      console.log('🔍 User data for order creation:', {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role
      });

      const order = await createOrder({
        customerName: formData.fullName,
        customerEmail: user.email || '',
        customerPhone: formData.contactNumber,
        customerAddress: formData.address,
        orderType: formData.deliveryMethod as 'delivery' | 'pickup',
        paymentMethod: formData.paymentMethod as 'cash' | 'card',
        userId: user.id,
      });

      // Save order details for confirmation page
      const orderDetails = {
        id: order.id,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.size_price || item.price,
          size: item.size_name
        })),
        total: getTotalPrice() + 2.99,
        customerInfo: {
          fullName: formData.fullName,
          contactNumber: formData.contactNumber,
          address: formData.address,
          deliveryMethod: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
      console.log('Order created successfully:', order);
      navigate(`/order-confirmation/${order.id}`);
    } catch (error: any) {
      console.error('Error placing order:', error);
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.message) {
        if (error.message.includes('not found')) {
          errorMessage = 'One or more items in your cart are no longer available.';
        } else if (error.message.includes('foreign key constraint')) {
          errorMessage = 'Some items in your cart are invalid. Please try clearing your cart and adding items again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate('/')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      {/* Enhanced Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/cart')}
                className="lg:hidden w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 mr-4"
              >
                <i className="ri-arrow-left-line text-xl text-orange-600" />
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Checkout</h1>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <span className="text-gray-600">Total:</span>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {formatCurrency(getTotalPrice())}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Contact Number"
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Delivery Method */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Method</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-orange-200 hover:bg-orange-50 ${formData.deliveryMethod === 'delivery' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={formData.deliveryMethod === 'delivery'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <i className="ri-truck-line text-2xl mb-2 text-orange-500"></i>
                  <span className="font-medium">Delivery</span>
                  <span className="text-sm text-gray-500">25-35 minutes</span>
                </label>
                <label className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-orange-200 hover:bg-orange-50 ${formData.deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={formData.deliveryMethod === 'pickup'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <i className="ri-store-2-line text-2xl mb-2 text-orange-500"></i>
                  <span className="font-medium">Pickup</span>
                  <span className="text-sm text-gray-500">15-20 minutes</span>
                </label>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-orange-200 hover:bg-orange-50 ${formData.paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <i className="ri-money-peso-circle-line text-2xl mb-2 text-orange-500"></i>
                  <span className="font-medium">{formData.deliveryMethod === 'delivery' ? 'Cash on Delivery' : 'Pay on Pickup'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0">
                      <img
                        src={item.image_url || `https://readdy.ai/api/search-image?query=delicious%20food%20dish%20restaurant%20meal%20appetizing%20colorful%20fresh%20ingredients%20beautifully%20plated%20gourmet%20cuisine%20culinary%20art&width=200&height=200&seq=food-placeholder&orientation=squarish`}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Regular price:</span>
                            <span className="text-gray-800">{formatCurrency(item.price)}</span>
                          </div>
                          {item.size_name && item.size_price && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Size ({item.size_name}):</span>
                              <span className="font-medium text-orange-600">+{formatCurrency(item.size_price)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Unit price:</span>
                            <span className="font-medium text-gray-800">{formatCurrency(item.price + (item.size_price || 0))}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium text-gray-800">{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency((item.price + (item.size_price || 0)) * item.quantity)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.quantity} × {formatCurrency(item.price + (item.size_price || 0))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(2.99)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2">
                    <span>Total</span>
                    <span className="text-orange-600">{formatCurrency(getTotalPrice() + 2.99)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-4 text-lg font-bold rounded-2xl transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <i className="ri-secure-payment-line mr-2" />
                    Place Order - {formatCurrency(getTotalPrice() + 2.99)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
