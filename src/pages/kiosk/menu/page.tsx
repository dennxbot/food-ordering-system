import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFoodItems } from '../../../hooks/useFoodItems';
import { useKioskCart } from '../../../hooks/useKioskCart';
import { useItemSizes } from '../../../hooks/useItemSizes';
import { formatCurrency } from '../../../utils/currency';

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  has_sizes?: boolean;
  category?: {
    name: string;
  };
}

interface LocalCategory {
  id: string;
  name: string;
}

interface Size {
  id: string;
  name: string;
  price: number;
}

const KioskMenuPage: React.FC = () => {
  const location = useLocation();
  const { foodItems, categories, isLoading } = useFoodItems();
  const { addToCart, cart } = useKioskCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedItemForSize, setSelectedItemForSize] = useState<FoodItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { sizes: itemSizes } = useItemSizes(selectedItemForSize?.id);

  const filteredItems = selectedCategory === 'All' 
    ? foodItems 
    : foodItems.filter((item: FoodItem) => item.category?.name === selectedCategory);

  console.log('🍽️ Kiosk Menu: Filtering items:', {
    selectedCategory,
    totalFoodItems: foodItems.length,
    filteredItems: filteredItems.length,
    categories: categories.map(c => c.name)
  });

  // Toast notification function
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000); // Hide after 3 seconds
  };

  // Phase 1: Fresh data loading on route change
  useEffect(() => {
    // Refresh data when route changes (fresh page reload)
    console.log('🍽️ Kiosk Menu: Fresh data load on route change');
    console.log('🍽️ Kiosk Menu: Current data state:', { 
      foodItems: foodItems.length, 
      categories: categories.length, 
      isLoading 
    });
    // Reset category selection on fresh load
    setSelectedCategory('All');
  }, [location.pathname, foodItems.length, categories.length, isLoading]);

  // Monitor cart changes
  useEffect(() => {
    console.log('🛒 Kiosk Menu: Cart state changed', {
      cartItems: cart.length,
      totalQuantity: cart.reduce((total, item) => total + item.quantity, 0)
    });
  }, [cart]);

  const handleAddToCart = async (item: FoodItem) => {
    console.log('🍽️ Kiosk Menu: Adding item to cart', {
      itemName: item.name,
      itemId: item.id,
      hasSizes: item.has_sizes
    });

    // Check if item has sizes and show modal
    if (item.has_sizes) {
      setSelectedItemForSize(item);
      setShowSizeModal(true);
      return;
    }

    // Add item without size
    try {
      await addToCart({ ...item, has_sizes: item.has_sizes || false }, undefined, 1);
      console.log('✅ Kiosk Menu: Item added to cart successfully');
      
      // Show success feedback
      showToastNotification(`✅ ${item.name} added to cart!`);
    } catch (error) {
      console.error('❌ Failed to add item to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const addItemWithSize = async (item: FoodItem, selectedSize?: Size) => {
    console.log('🍽️ Kiosk Menu: Adding item with size to cart', {
      itemName: item.name,
      itemId: item.id,
      sizeName: selectedSize?.name,
      sizeId: selectedSize?.id
    });

    try {
      await addToCart(
        { ...item, has_sizes: item.has_sizes || false },
        selectedSize?.id || undefined,
        1
      );
      setShowSizeModal(false);
      setSelectedItemForSize(null);
      
      console.log('✅ Kiosk Menu: Item with size added to cart successfully');
      
      // Show success feedback
      const sizeText = selectedSize ? ` (${selectedSize.name})` : '';
      showToastNotification(`✅ ${item.name}${sizeText} added to cart!`);
    } catch (error) {
      console.error('❌ Failed to add item to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  if (isLoading) {
    console.log('🍽️ Kiosk Menu: Still loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  console.log('🍽️ Kiosk Menu: Rendering with data:', { 
    foodItems: foodItems.length, 
    categories: categories.length, 
    filteredItems: filteredItems.length 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Our Menu</h1>
              <p className="text-xl text-gray-600 mt-2">Choose your favorites</p>
            </div>
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg">
              <span className="text-lg font-medium">
                {cart.length} items in cart
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category: LocalCategory) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items available</h3>
            <p className="text-gray-600">
              {foodItems.length === 0 
                ? "No food items found in the database. Please contact the administrator."
                : `No items found in the "${selectedCategory}" category.`
              }
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>Debug info: {foodItems.length} total items, {categories.length} categories</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item: FoodItem) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.name}
                </h3>
                
                {item.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(item.price)}
                  </span>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Size Selection Modal */}
      {showSizeModal && selectedItemForSize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Choose Size</h3>
              <button 
                onClick={() => {
                  setShowSizeModal(false);
                  setSelectedItemForSize(null);
                }}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{selectedItemForSize.name}</h4>
              <p className="text-gray-600">{selectedItemForSize.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Regular size option */}
              <button
                onClick={() => addItemWithSize(selectedItemForSize)}
                className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-semibold text-gray-900">Regular</p>
                    <p className="text-gray-600 mt-1">Standard size</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(selectedItemForSize.price)}
                  </p>
                </div>
              </button>

              {/* Available sizes */}
              {itemSizes?.map((size: Size) => (
                <button
                  key={size.id}
                  onClick={() => addItemWithSize(selectedItemForSize, size)}
                  className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-semibold text-gray-900">{size.name}</p>
                      <p className="text-gray-600 mt-1">{size.name} size</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(selectedItemForSize.price + size.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✅</span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskMenuPage;