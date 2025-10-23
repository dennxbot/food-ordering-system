import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';

const KioskOrderSuccessPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Redirect if not authenticated or not a kiosk user
  if (!isAuthenticated || user?.role !== 'kiosk') {
    return <Navigate to="/login" replace />;
  }

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/kiosk');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleNewOrder = () => {
    navigate('/kiosk');
  };

  const handleViewOrders = () => {
    navigate('/kiosk/orders');
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            Order Placed Successfully!
          </h1>
          
          <p className="text-xl text-gray-700 mb-6">
            Thank you for your order. Your food is being prepared and will be ready soon.
          </p>

          <div className="bg-green-100 border border-green-300 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-green-800 mb-2">
              What's Next?
            </h2>
            <ul className="text-lg text-green-700 space-y-2 text-left">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Your order has been sent to the kitchen
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                You'll receive updates on your order status
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Please wait for your order number to be called
              </li>
            </ul>
          </div>

          {/* Order Info */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-lg text-gray-600">
              <strong>Order Time:</strong> {new Date().toLocaleTimeString()}
            </p>
            <p className="text-lg text-gray-600">
              <strong>Customer:</strong> {user?.full_name || 'Kiosk Customer'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleNewOrder}
            className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg text-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Place Another Order
          </button>
          
          <button
            onClick={handleViewOrders}
            className="w-full bg-gray-500 text-white py-4 px-8 rounded-lg text-xl font-medium hover:bg-gray-600 transition-colors"
          >
            View My Orders
          </button>
        </div>

        {/* Auto-redirect Notice */}
        <div className="mt-8 p-4 bg-blue-100 rounded-lg">
          <p className="text-blue-800 text-lg">
            Returning to main menu in <strong>{countdown}</strong> seconds...
          </p>
          <button
            onClick={() => setCountdown(0)}
            className="mt-2 text-blue-600 underline hover:text-blue-800"
          >
            Go now
          </button>
        </div>

        {/* Print Receipt Option */}
        <div className="mt-6">
          <button
            onClick={() => window.print()}
            className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg text-lg font-medium hover:bg-gray-300 transition-colors"
          >
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default KioskOrderSuccessPage;