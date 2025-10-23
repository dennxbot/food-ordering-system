
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../hooks/useCart';

export default function FloatingCartButton() {
  const navigate = useNavigate();
  const { getTotalItems, getTotalPrice } = useCart();
  const totalItems = getTotalItems();

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 z-50 cursor-pointer"
    >
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="relative">
          <i className="ri-shopping-cart-fill text-xl"></i>
          <span className="absolute -top-2 -right-2 bg-white text-orange-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold">View Cart</p>
          <p className="text-xs opacity-90">{formatCurrency(getTotalPrice())}</p>
        </div>
      </div>
    </button>
  );
}
