
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFoodItems } from '../../hooks/useFoodItems';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import FoodCard from '../../components/feature/FoodCard';
import BottomNavigation from '../../components/feature/BottomNavigation';
import FloatingCartButton from '../../components/feature/FloatingCartButton';
import Button from '../../components/base/Button';

export default function Home() {
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const { foodItems, categories, isLoading, getFeaturedItems } = useFoodItems();
  const [notification, setNotification] = useState<{ show: boolean; type: 'success' | 'warning'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  const featuredItems = getFeaturedItems();

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
    
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || `https://readdy.ai/api/search-image?query=delicious%20${encodeURIComponent(item.name)}%20food%20photography%20with%20simple%20clean%20background&width=400&height=300&seq=${item.id}&orientation=landscape`,
      category_id: item.category_id,
      is_available: item.is_available,
      is_featured: item.is_featured,
      has_sizes: item.has_sizes,
      preparation_time: item.preparation_time
    };
    
    try {
      await addToCart(cartItem);
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
          <p className="text-gray-600 font-medium">Loading delicious food...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20 lg:pb-8">
      {/* Top Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-900">Food Ordering System</h2>
            </div>
            <button
              onClick={() => navigate('/access-selection')}
              className="text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200 flex items-center gap-2"
            >
              <i className="ri-apps-line"></i>
              Access Selection
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div 
        className="relative min-h-[70vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://readdy.ai/api/search-image?query=modern%20restaurant%20interior%20with%20warm%20lighting%2C%20elegant%20dining%20atmosphere%2C%20professional%20food%20service%20background%2C%20cozy%20ambiance%20with%20wooden%20tables%20and%20comfortable%20seating&width=1920&height=1080&seq=hero1&orientation=landscape')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 via-red-900/60 to-orange-900/80"></div>
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Delicious Food
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Delivered Fresh
            </span>
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-200 leading-relaxed">
            Experience the finest flavors crafted with love and delivered to your doorstep
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/menu')}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <i className="ri-restaurant-line mr-3 text-xl"></i>
              Order Now
            </Button>
            <Button
              onClick={() => navigate('/menu')}
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300"
            >
              <i className="ri-eye-line mr-3 text-xl"></i>
              View Menu
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Browse Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our carefully curated selection of delicious food categories
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate('/menu')}
                className="group bg-white rounded-3xl shadow-lg border border-orange-100 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={category.image_url || `https://readdy.ai/api/search-image?query=delicious%20${encodeURIComponent(category.name)}%20food%20category%20with%20appetizing%20presentation%2C%20restaurant%20quality%20photography%2C%20clean%20background&width=400&height=300&seq=${category.id}&orientation=landscape`}
                    alt={category.name}
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-gray-200 text-sm">{category.description || `Explore our ${category.name.toLowerCase()} selection`}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Items Section */}
      {featuredItems.length > 0 && (
        <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Featured Dishes
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our chef's special recommendations just for you
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {featuredItems.slice(0, 8).map((item) => (
                <FoodCard
                  key={item.id}
                  item={{
                    id: item.id,
                    name: item.name,
                    description: item.description || '',
                    price: item.price,
                    image_url: item.image_url || `https://readdy.ai/api/search-image?query=delicious%20${encodeURIComponent(item.name)}%20food%20photography%20with%20simple%20clean%20background&width=400&height=300&seq=${item.id}&orientation=landscape`,
                    category_id: item.category_id,
                    is_featured: item.is_featured,
                    is_available: item.is_available,
                    has_sizes: item.has_sizes || false,
                    preparation_time: item.preparation_time
                  }}
                  onAddToCart={handleAddToCart}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button
                onClick={() => navigate('/menu')}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <i className="ri-arrow-right-line mr-3 text-xl"></i>
                View Full Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Order?
            </h2>
            <p className="text-xl text-orange-100 mb-8 leading-relaxed">
              Join thousands of satisfied customers who trust us for their daily meals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/menu')}
                className="inline-flex items-center justify-center bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <i className="ri-shopping-cart-line mr-3 text-xl"></i>
                Start Ordering
              </button>
              {!user && (
                <button
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center justify-center border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300"
                >
                  <i className="ri-user-add-line mr-3 text-xl"></i>
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
