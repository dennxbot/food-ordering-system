import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../hooks/useCart';
import { Navigate, useNavigate } from 'react-router-dom';

const KioskCartPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal, createOrder } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not authenticated or not a kiosk user
  if (!isAuthenticated || user?.role !== 'kiosk') {
    return <Navigate to="/login" replace />;
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const orderData = {
        customerName: user?.full_name || 'Kiosk Customer',
        customerEmail: user?.email || '',
        customerPhone: user?.contact_number || '',
        customerAddress: 'Kiosk Order - In Store',
        orderType: 'pickup' as const,
        paymentMethod: 'cash' as const,
        userId: user?.id || ''
      };

      await createOrder(orderData);
      clearCart();
      navigate('/kiosk/order-success');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Your cart is empty
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Add some delicious items to get started!
          </p>
          <button
            onClick={() => navigate('/kiosk/menu')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 text-center">
            Review Your Order
          </h1>
          <p className="text-xl text-gray-600 text-center mt-2">
            Make changes or proceed to checkout
          </p>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Order Items ({cart.length})
            </h2>
            
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl">🍽️</span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {item.name}
                      </h3>
                      <p className="text-lg text-green-600 font-medium">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-12 h-12 bg-red-500 text-white rounded-lg font-bold text-xl hover:bg-red-600 transition-colors"
                      >
                        -
                      </button>
                      
                      <span className="text-2xl font-bold text-gray-800 min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-12 h-12 bg-green-500 text-white rounded-lg font-bold text-xl hover:bg-green-600 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-[6rem]">
                      <p className="text-2xl font-bold text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-12 h-12 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Order Summary
          </h2>
          
          <div className="space-y-2 text-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>${(getCartTotal() * 0.08).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-2xl font-bold">
                <span>Total:</span>
                <span className="text-green-600">
                  ${(getCartTotal() * 1.08).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/kiosk/menu')}
            className="flex-1 bg-gray-500 text-white py-4 rounded-lg text-xl font-medium hover:bg-gray-600 transition-colors"
          >
            Add More Items
          </button>
          
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="flex-1 bg-green-600 text-white py-4 rounded-lg text-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KioskCartPage;