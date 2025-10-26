import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useFoodItems } from '../../../hooks/useFoodItems';
import { useItemSizes } from '../../../hooks/useItemSizes';
import { formatCurrency } from '../../../utils/currency';
import { usePOS } from '../../../hooks/usePOS';
import Button from '../../../components/base/Button';

interface FoodItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_name: string;
  has_sizes?: boolean;
}

interface Size {
  id: string;
  name: string;
  price: number;
}

interface POSOrderItem {
  food_item_id: string;
  size_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface POSItem {
  id: string;
  name: string;
  base_price: number;
  selected_size?: Size;
  quantity: number;
  has_sizes?: boolean;
}

const AdminPOS = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { foodItems: rawFoodItems, isLoading: foodLoading } = useFoodItems();

  const [selectedItems, setSelectedItems] = useState<POSItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [selectedItemForSize, setSelectedItemForSize] = useState<FoodItem | null>(null);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { sizes: itemSizes } = useItemSizes(selectedItemForSize?.id);
  const { 
    isProcessing,
    error: posError,
    createOrder
  } = usePOS();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate('/admin/login');
      return;
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (posError) {
      setErrorMessage(posError);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    }
  }, [posError]);

  const foodItems = rawFoodItems.map(item => ({
    ...item,
    category_name: item.category?.name || 'Uncategorized'
  })) as FoodItem[];

  const categories = Array.from(new Set(foodItems.map(item => item.category_name).filter(Boolean)));
  
  const filteredItems = filter === 'all' 
    ? foodItems 
    : foodItems.filter(item => item.category_name === filter);

  const addItem = (item: FoodItem) => {
    if (item.has_sizes) {
      setSelectedItemForSize(item);
      setShowSizeModal(true);
      return;
    }

    addItemWithSize(item);
  };

  const addItemWithSize = (item: FoodItem, selectedSize?: Size) => {
    const itemId = selectedSize ? `${item.id}-${selectedSize.id}` : item.id;
    
    const existingItem = selectedItems.find(selected => {
      if (selectedSize) {
        return selected.id === itemId && selected.selected_size?.id === selectedSize.id;
      }
      return selected.id === itemId;
    });

    if (existingItem) {
      setSelectedItems(selectedItems.map(selected =>
        selected.id === itemId
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      const newItem: POSItem = {
        id: itemId,
        name: item.name,
        base_price: item.price,
        quantity: 1,
        has_sizes: item.has_sizes
      };

      if (selectedSize) {
        newItem.selected_size = selectedSize;
      }

      setSelectedItems([...selectedItems, newItem]);
    }

    setShowSizeModal(false);
    setSelectedItemForSize(null);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter(item => item.id !== id));
    } else {
      setSelectedItems(selectedItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const clearOrder = () => {
    setSelectedItems([]);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const itemPrice = item.selected_size 
        ? item.base_price + item.selected_size.price 
        : item.base_price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const processPayment = async () => {
    if (selectedItems.length === 0) {
      setErrorMessage('Please add items to the order');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
      return;
    }

    try {
      const orderItems = selectedItems.map(item => {
        const unitPrice = item.selected_size 
          ? item.base_price + item.selected_size.price 
          : item.base_price;
        
        // Extract the original food item ID by removing any size suffix
        const foodItemId = item.id.includes('-') ? item.id.substring(0, 36) : item.id;
        
        return {
          food_item_id: foodItemId,
          size_id: item.selected_size?.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity
        };
      });

      const order = await createOrder(
        orderItems,
        paymentMethod as 'cash' | 'card',
        calculateTotal(),
        undefined, // customerName - can be added later if needed
        undefined  // customerPhone - can be added later if needed
      );

      setLastOrderId(order.order_number);
      setShowReceipt(true);
    } catch (error: any) {
      setErrorMessage(error.message);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const startNewOrder = () => {
    setSelectedItems([]);
    setShowReceipt(false);
    setLastOrderId('');
  };

  if (isLoading || foodLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate('/admin')} className="mr-4">
                <i className="ri-arrow-left-line text-xl"></i>
              </button>
              <h1 className="text-xl font-bold">Point of Sale</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/pos/sales')}
                className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-200 transition-colors"
              >
                <i className="ri-line-chart-line mr-2"></i>
                Sales Report
              </button>
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReceipt ? (
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Receipt</h2>
              <p className="text-sm text-gray-600">Order #{lastOrderId}</p>
              <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
            </div>

            <div className="border-t border-b border-gray-200 py-4 mb-4">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <div>
                    <div>
                      <span className="font-medium">{item.name}</span>
                      {item.selected_size && (
                        <span className="text-gray-500 text-sm ml-2">({item.selected_size.name})</span>
                      )}
                      <span className="text-gray-600 ml-2">x{item.quantity}</span>
                    </div>
                  </div>
                  <span>
                    {formatCurrency(
                      (item.selected_size 
                        ? (item.base_price + item.selected_size.price)
                        : item.base_price
                      ) * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Payment:</span>
                <span className="capitalize">{paymentMethod}</span>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 mb-6">
              <p>Thank you for your business!</p>
            </div>

            <div className="flex space-x-3 print:hidden">
              <Button
                onClick={printReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 whitespace-nowrap"
              >
                <i className="ri-printer-line mr-2"></i>
                Print Receipt
              </Button>
              <Button
                onClick={startNewOrder}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 whitespace-nowrap"
              >
                New Order
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex space-x-1 overflow-x-auto">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      filter === 'all'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setFilter(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        filter === category
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <i className="ri-restaurant-line text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-500">No items available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
                    >
                      <img
                        src={item.image_url || ''}
                        alt={item.name}
                        className="w-full h-24 object-cover object-top rounded-lg mb-3"
                      />
                      <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                      <p className="text-orange-600 font-bold">{formatCurrency(item.price)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-4 h-fit">
              <h2 className="text-lg font-bold mb-4">Current Order</h2>

              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-shopping-cart-line text-3xl mb-2"></i>
                  <p>No items selected</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          {item.selected_size && (
                            <p className="text-gray-500 text-xs">Size: {item.selected_size.name}</p>
                          )}
                          <p className="text-orange-600 text-sm">
                            {item.selected_size 
                              ? `${formatCurrency(item.base_price + item.selected_size.price)}`
                              : `${formatCurrency(item.base_price)}`
                            }
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                          >
                            <i className="ri-subtract-line text-xs"></i>
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center"
                          >
                            <i className="ri-add-line text-xs text-orange-600"></i>
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-8 bg-red-100 rounded-full flex items-center justify-center ml-2"
                          >
                            <i className="ri-close-line text-xs text-red-600"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-xl font-bold text-orange-600">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPaymentMethod('cash')}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium whitespace-nowrap ${
                            paymentMethod === 'cash'
                              ? 'bg-orange-100 border-orange-300 text-orange-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Cash
                        </button>
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium whitespace-nowrap ${
                            paymentMethod === 'card'
                              ? 'bg-orange-100 border-orange-300 text-orange-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Card
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={processPayment}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold whitespace-nowrap disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <i className="ri-loader-2-line animate-spin mr-2"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="ri-check-line mr-2"></i>
                            Mark as Paid
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={clearOrder}
                        disabled={isProcessing}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 py-2 whitespace-nowrap disabled:opacity-50"
                      >
                        Clear Order
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Size Selection Modal */}
      {showSizeModal && selectedItemForSize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Select Size</h3>
              <button 
                onClick={() => {
                  setShowSizeModal(false);
                  setSelectedItemForSize(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Regular size option */}
              <button
                onClick={() => addItemWithSize(selectedItemForSize)}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300"
              >
                <div className="text-center">
                  <p className="font-semibold text-gray-900">Regular</p>
                  <p className="text-sm text-gray-500 mt-1">Standard size</p>
                  <p className="text-sm font-medium text-orange-600 mt-2">
                    {formatCurrency(selectedItemForSize.price)}
                  </p>
                </div>
              </button>

              {/* Available sizes */}
              {itemSizes?.map((size: Size) => (
                <button
                  key={size.id}
                  onClick={() => addItemWithSize(selectedItemForSize, size)}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300"
                >
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{size.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {size.name} size
                    </p>
                    <p className="text-sm font-medium text-orange-600 mt-2">
                      {formatCurrency(selectedItemForSize.price + size.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center">
          <i className="ri-error-warning-line text-xl mr-2"></i>
          <span>{errorMessage}</span>
          <button 
            onClick={() => setShowErrorToast(false)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPOS;