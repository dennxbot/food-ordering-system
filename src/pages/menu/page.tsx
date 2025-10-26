
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFoodItems } from '../../hooks/useFoodItems';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import FoodCard from '../../components/feature/FoodCard';
import BottomNavigation from '../../components/feature/BottomNavigation';
import FloatingCartButton from '../../components/feature/FloatingCartButton';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';

export default function Menu() {
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const { foodItems, categories, isLoading, searchFoodItems, refetch } = useFoodItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'warning'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  // Use the improved search function from the hook
  const searchResults = searchFoodItems(searchQuery);
  
  const filteredItems = searchResults.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category_id === selectedCategory;
    return matchesCategory; // Remove the is_available filter - show all items
  });

  const handleAddToCart = async (item: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if item already exists in cart
    const existingItem = items.find(i => i.id === item.id);
    if (existingItem) {
      setNotification({
        show: true,
        type: 'warning',
        message: 'This item is already in your cart. You can update the quantity in the cart.'
      });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
      return;
    }
    
    try {
      await addToCart(item);
      setNotification({
        show: true,
        type: 'success',
        message: 'Item successfully added to cart!'
      });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    } catch (error: any) {
      setNotification({
        show: true,
        type: 'warning',
        message: 'Failed to add item to cart. Please try again.'
      });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  const handleViewDetails = (item: any) => {
    navigate(`/food/${item.id}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset category filter when searching
    if (e.target.value.trim()) {
      setSelectedCategory('All');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="ri-restaurant-line text-orange-500 text-xl"></i>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 lg:pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="lg:hidden flex items-center">
                <button
                  onClick={() => navigate('/')}
                  className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 mr-4"
                >
                  <i className="ri-arrow-left-line text-xl text-orange-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Menu</h1>
                  <p className="text-sm text-gray-600">
                    {searchQuery ? `${filteredItems.length} results found` : `${filteredItems.length} delicious items`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300"
                title="Refresh menu"
              >
                <i className="ri-refresh-line text-xl text-orange-600" />
              </button>
              <div className="lg:hidden">
                <button
                  onClick={() => navigate('/cart')}
                  className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300"
                >
                  <i className="ri-shopping-cart-line text-xl text-orange-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Input
              placeholder="Search by name, description, or category..."
              value={searchQuery}
              onChange={handleSearchChange}
              icon="ri-search-line"
              className="pl-12 pr-4 py-3 text-base bg-white/70 backdrop-blur-sm border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-2xl shadow-sm w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Tabs */}
        <div className="py-6">
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide lg:flex-wrap">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === 'All'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-700 hover:bg-orange-50 border border-orange-100 shadow-sm'
              }`}
            >
              <i className="ri-apps-line mr-2"></i>
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200'
                    : 'bg-white text-gray-700 hover:bg-orange-50 border border-orange-100 shadow-sm'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredItems.map((item) => (
              <FoodCard
                key={item.id}
                item={{
                  id: item.id,
                  name: item.name,
                  description: item.description || '',
                  price: item.price,
                  image_url: item.image_url || `https://readdy.ai/api/search-image?query=delicious%20${encodeURIComponent(item.name)}%20food%20photography%20with%20simple%20clean%20background&width=400&height=300&seq=${item.id}&orientation=landscape`,
                  category_id: item.category_id,
                  is_available: item.is_available,
                  is_featured: item.is_featured,
                  has_sizes: item.has_sizes || false,
                  preparation_time: item.preparation_time
                }}
                onAddToCart={() => handleAddToCart(item)}
                onViewDetails={() => handleViewDetails(item)}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-orange-100">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-search-line text-3xl text-orange-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No results found' : 'No items found'}
              </h4>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No items match "${searchQuery}". Try different keywords or browse categories.`
                  : 'Try searching for something else or browse different categories'
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  {searchQuery ? 'Clear search' : 'Reset filters'}
                </Button>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  View all items
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-24 lg:bottom-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white border border-orange-200 hover:border-orange-300 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        <i className="ri-arrow-up-line text-xl text-orange-600"></i>
      </button>

      {/* Notification Toast */}
      {notification.show && (
        <div 
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-50 animate-bounce ${
            notification.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i className={`text-lg ${notification.type === 'success' ? 'ri-check-line' : 'ri-information-line'}`} />
            </div>
            <div>
              <p className="font-semibold">{notification.type === 'success' ? 'Success!' : 'Note'}</p>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNavigation />
      </div>

      {/* Desktop Floating Cart Button */}
      <div className="hidden lg:block">
        <FloatingCartButton />
      </div>
    </div>
  );
}
