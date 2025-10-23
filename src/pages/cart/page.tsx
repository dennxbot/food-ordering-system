
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/base/Button';
import BottomNavigation from '../../components/feature/BottomNavigation';

export default function Cart() {
  const navigate = useNavigate();
  const { items: cartItems, updateQuantity, removeFromCart, getTotalPrice } = useCart();
  const { user } = useAuth();

  // Add loading state check
  if (!cartItems) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center pb-20 lg:pb-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center pb-20 lg:pb-8">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl border border-orange-100 max-w-sm mx-4">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-login-box-line text-3xl text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to login to view your cart and place orders</p>
          <Button 
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <i className="ri-login-box-line mr-2" />
            Login Now
          </Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 lg:pb-8">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 mr-4"
              >
                <i className="ri-arrow-left-line text-xl text-orange-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Your Cart</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-orange-100 max-w-md mx-4">
            <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-cart-line text-4xl text-orange-400" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious food to get started on your culinary journey</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/')}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <i className="ri-home-line mr-2" />
                Go Home
              </Button>
              <Button 
                onClick={() => navigate('/menu')}
                variant="outline"
                className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <i className="ri-restaurant-line mr-2" />
                Browse Menu
              </Button>
            </div>
          </div>
        </div>
        
        <div className="lg:hidden">
          <BottomNavigation />
        </div>
      </div>
    );
  }

  const deliveryFee = 2.99;
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 lg:pb-8">
      {/* Enhanced Header */}
      <div className="bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 mr-4"
            >
              <i className="ri-arrow-left-line text-xl text-orange-600" />
            </button>
              <div>
              <h1 className="text-lg font-bold text-gray-900">Your Cart</h1>
              <p className="text-sm text-gray-600">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} 
                {cartItems.reduce((total, item) => total + item.quantity, 0) > cartItems.length && 
                  ` (${cartItems.reduce((total, item) => total + item.quantity, 0)} total)`}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-full">
            <span className="text-sm lg:text-base font-bold text-orange-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Cart Items - Left Column on Desktop */}
          <div className="lg:col-span-2">
            <div className="space-y-4 lg:space-y-6 mb-8 lg:mb-0">
              {cartItems.map((item, index) => (
                <div key={item.id} className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.image_url || 'https://readdy.ai/api/search-image?query=delicious%20food%20dish%20restaurant%20meal%20appetizing%20colorful%20fresh%20ingredients%20beautifully%20plated%20gourmet%20cuisine%20culinary%20art&width=200&height=200&seq=food-placeholder&orientation=squarish'}
                        alt={item.name}
                        className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl object-cover object-top"
                      />
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1 text-base lg:text-lg truncate">{item.name}</h3>
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Regular price:</span>
                          <span className="text-sm text-gray-800">{formatCurrency(item.price)}</span>
                        </div>
                        {item.size_name && item.size_price && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Size ({item.size_name}):</span>
                            <span className="text-sm font-medium text-orange-600">+{formatCurrency(item.size_price)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Unit price:</span>
                          <span className="text-sm font-medium text-gray-800">{formatCurrency(item.price + (item.size_price || 0))}</span>
                        </div>
                      </div>
                      <p className="text-orange-500 font-bold text-base lg:text-lg">
                        Total: {formatCurrency((item.price + (item.size_price || 0)) * item.quantity)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 lg:mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 lg:gap-3 bg-gray-50 rounded-xl lg:rounded-2xl p-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white border border-orange-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all duration-300"
                          >
                            <i className="ri-subtract-line text-sm text-orange-600" />
                          </button>
                          <span className="font-bold w-6 lg:w-8 text-center text-gray-900 text-sm lg:text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white border border-orange-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all duration-300"
                          >
                            <i className="ri-add-line text-sm text-orange-600" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 lg:w-10 lg:h-10 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center text-red-500 hover:text-red-600 cursor-pointer transition-all duration-300"
                        >
                          <i className="ri-delete-bin-line text-sm lg:text-base" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-base lg:text-lg">
                        {formatCurrency(item.price + (item.size_price || 0))}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity} × {formatCurrency(item.price + (item.size_price || 0))} = {formatCurrency((item.price + (item.size_price || 0)) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary - Right Column on Desktop, Sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              {/* Order Summary */}
              <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-lg border border-orange-100 mb-6 lg:mb-8">
                <h3 className="font-bold text-gray-900 mb-4 lg:mb-6 text-lg lg:text-xl flex items-center">
                  <i className="ri-file-list-3-line mr-3 text-orange-500"></i>
                  Order Summary
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center text-sm lg:text-base">
                      <i className="ri-shopping-bag-line mr-2 text-orange-400"></i>
                      Subtotal ({cartItems.length} items)
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center text-sm lg:text-base">
                      <i className="ri-truck-line mr-2 text-orange-400"></i>
                      Delivery Fee
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 lg:pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg lg:text-xl text-gray-900">Total</span>
                      <span className="font-bold text-xl lg:text-2xl bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl lg:rounded-2xl p-4 mb-6 lg:mb-8 border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-time-line text-orange-600"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm lg:text-base">Estimated Delivery</p>
                    <p className="text-sm text-gray-600">25-35 minutes</p>
                  </div>
                </div>
              </div>

              {/* Total and Checkout Button */}
              <div className="sticky bottom-4 lg:static space-y-4">
                {/* Total Amount Display */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">Total Amount</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-center px-4 py-3">
                    <i className="ri-secure-payment-line mr-2" />
                    <span>Proceed to Checkout</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}
