import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../../../hooks/useCart';
import { useMenu } from '../../../hooks/useMenu';
import { Navigate } from 'react-router-dom';

const KioskMenuPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { items: menuItems, loading } = useMenu();
  const { addToCart, cart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Redirect if not authenticated or not a kiosk user
  if (!isAuthenticated || user?.role !== 'kiosk') {
    return <Navigate to="/login" replace />;
  }

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item: any) => {
    addToCart(item);
  };

  const getCartItemCount = (itemId: string) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 text-center">
            Select Your Items
          </h1>
          <p className="text-xl text-gray-600 text-center mt-2">
            Touch an item to add it to your order
          </p>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const cartCount = getCartItemCount(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleAddToCart(item)}
              >
                {/* Item Image */}
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-6xl">🍽️</div>
                  )}
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">
                      ${item.price.toFixed(2)}
                    </span>
                    
                    {cartCount > 0 && (
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {cartCount}
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors"
                  >
                    Add to Order
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">
              No items found
            </h3>
            <p className="text-gray-500">
              Try selecting a different category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskMenuPage;