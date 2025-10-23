import { useState, useEffect } from 'react';
import type { CartItem } from '../../types';
import { useParams, useNavigate } from 'react-router-dom';
import { useFoodItems } from '../../hooks/useFoodItems';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/currency';
import { useItemSizes } from '../../hooks/useItemSizes';
import Button from '../../components/base/Button';

export default function FoodDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const { getFoodItemById, isLoading } = useFoodItems();
  const [quantity, setQuantity] = useState(1);
  const [showAddToCartMessage, setShowAddToCartMessage] = useState(false);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const item = getFoodItemById(id || '');
  const { sizes, isLoading: sizesLoading } = useItemSizes(id);

  // Initialize with no size selected
  useEffect(() => {
    setSelectedSizeId(null);
  }, [sizes]);

  const selectedSize = selectedSizeId ? sizes.find(s => s.id === selectedSizeId) : null;
  const currentPrice = item ? (selectedSize ? item.price + selectedSize.price : item.price) : 0;

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!item) return;

    // Check if size is required but not selected
    if (item.has_sizes && !selectedSizeId) {
      alert('Please select a size before adding to cart');
      return;
    }
    
    // Use the proper FoodItem interface structure
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      category_id: item.category_id,
      is_available: item.is_available,
      is_featured: item.is_featured,
      has_sizes: item.has_sizes,
      preparation_time: item.preparation_time
    };
    
    try {
      // Check if item already exists in cart
      const existingItem = items.find((i: CartItem) => 
        i.id === item.id && i.size_id === (selectedSize?.id || null)
      );

      if (existingItem) {
        alert('This item is already in your cart. You can update the quantity in the cart.');
        return;
      }

      await addToCart(
        cartItem,
        quantity,
        selectedSize?.id || null,
        selectedSize?.name || null,
        selectedSize?.price || null
      );

      // Show success message only for new items
      setShowAddToCartMessage(true);
      setTimeout(() => {
        setShowAddToCartMessage(false);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to add item to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="ri-restaurant-line text-orange-500 text-xl"></i>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading delicious details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl border border-orange-100 max-w-sm mx-4">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-3xl text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Food item not found</h3>
          <p className="text-gray-500 mb-6">The item you're looking for doesn't exist</p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <i className="ri-home-line mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="lg:hidden w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300"
          >
            <i className="ri-arrow-left-line text-xl text-orange-600" />
          </button>
          <h1 className="lg:hidden text-lg font-bold text-gray-900">Food Details</h1>
          <button className="w-10 h-10 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300">
            <i className="ri-heart-line text-xl text-orange-600" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Enhanced Food Image */}
          <div className="relative aspect-[4/3] lg:aspect-[16/9] overflow-hidden rounded-3xl lg:sticky lg:top-24">
            <img
              src={item.image_url || `https://readdy.ai/api/search-image?query=delicious%20$%7Bitem.name%7D%20food%20photography%20with%20simple%20clean%20background&width=400&height=300&seq=${item.id}&orientation=landscape`}
              alt={item.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            {item.is_featured && (
              <div className="absolute top-6 left-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ Featured Item
              </div>
            )}
            {!item.is_available && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-lg shadow-xl">
                  Out of Stock
                </div>
              </div>
            )}
            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center gap-1 text-yellow-500">
                <i className="ri-star-fill"></i>
                <span className="font-semibold text-gray-900">4.8</span>
                <span className="text-gray-600 text-sm">(124)</span>
              </div>
            </div>
          </div>

          {/* Enhanced Food Info */}
          <div className="lg:col-start-2">
            <div className="bg-white lg:bg-transparent rounded-t-3xl lg:rounded-none -mt-6 lg:mt-0 relative z-10 shadow-2xl lg:shadow-none">
              <div className="p-8 lg:p-0 lg:pb-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{item.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {formatCurrency(currentPrice)}
                      </span>
                      <div className="flex items-center gap-2 text-sm lg:text-base text-gray-500">
                        <i className="ri-time-line"></i>
                        <span>15-20 min</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm lg:text-base text-gray-500">
                        <i className="ri-fire-line"></i>
                        <span>350 cal</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3">Description</h3>
                  <p className={`text-gray-600 leading-relaxed lg:text-lg ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                    {item.description || 'A delicious and carefully prepared dish made with the finest ingredients. Perfect for any time of the day and guaranteed to satisfy your taste buds with its amazing flavors and textures.'}
                  </p>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-orange-500 font-medium text-sm lg:text-base mt-2 cursor-pointer hover:text-orange-600"
                  >
                    {showFullDescription ? 'Show less' : 'Read more'}
                  </button>
                </div>

                {/* Size Selection */}
                {item.is_available && item.has_sizes && (
                  <div className="mb-8">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Choose Size</h3>
                    {sizesLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
                      </div>
                    ) : sizes.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3 lg:gap-4">
                        {sizes.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSelectedSizeId(selectedSizeId === size.id ? null : size.id)}
                            className={`p-4 lg:p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                              selectedSizeId === size.id
                                ? 'border-orange-500 bg-orange-50 shadow-lg'
                                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                            }`}
                          >
                            <div className="text-center">
                              <p className={`font-semibold lg:text-lg ${selectedSizeId === size.id ? 'text-orange-600' : 'text-gray-900'}`}>
                                {size.name}
                              </p>
                              <p className="text-xs lg:text-sm text-gray-500 mt-1">{size.description || ''}</p>
                              <p className={`text-sm lg:text-base font-medium mt-2 ${selectedSizeId === size.id ? 'text-orange-600' : 'text-gray-600'}`}>
                                {formatCurrency(size.price)}
                              </p>
                              {size.is_default && (
                                <span className="inline-block bg-orange-100 text-orange-600 text-xs lg:text-sm px-2 py-1 rounded-full mt-2">
                                  Recommended
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No size options available</p>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                {item.is_available && (
                  <div className="mb-8">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4">Quantity</h3>
                    <div className="flex items-center justify-center gap-6 bg-gray-50 rounded-2xl p-4 lg:p-6">
                      <button
                        onClick={decrementQuantity}
                        className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white border-2 border-orange-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all duration-300 disabled:opacity-50"
                        disabled={quantity <= 1}
                      >
                        <i className="ri-subtract-line text-xl lg:text-2xl text-orange-600" />
                      </button>
                      <span className="text-2xl lg:text-3xl font-bold text-gray-900 w-12 lg:w-14 text-center">{quantity}</span>
                      <button
                        onClick={incrementQuantity}
                        className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white border-2 border-orange-200 flex items-center justify-center hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all duration-300"
                      >
                        <i className="ri-add-line text-xl lg:text-2xl text-orange-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Total Price */}
                {item.is_available && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 lg:p-8 rounded-2xl mb-8 border border-orange-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg lg:text-xl font-medium text-gray-700">Total Price</p>
                        <p className="text-sm lg:text-base text-gray-500">{quantity} × {formatCurrency(currentPrice)}</p>
                      </div>
                      <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {formatCurrency(currentPrice * quantity)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!item.is_available}
                  className={`w-full py-4 lg:py-5 text-lg lg:text-xl font-bold rounded-2xl transition-all duration-300 ${
                    item.is_available 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  size="lg"
                >
                  {item.is_available ? (
                    <>
                      <i className="ri-shopping-cart-line mr-3" />
                      Add to Cart - {formatCurrency(currentPrice * quantity)}
                    </>
                  ) : (
                    <>
                      <i className="ri-close-circle-line mr-3" />
                      Currently Out of Stock
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Add to Cart Message */}
      {showAddToCartMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className="ri-check-line text-xl" />
            </div>
            <div>
              <p className="font-bold text-lg">Added to cart!</p>
              <p className="text-sm opacity-90">Item successfully added</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}