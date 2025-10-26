
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/currency';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/base/Button';
import Input from '../../../components/base/Input';
import SizeManager from '../../../components/feature/SizeManager';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  is_available: boolean;
  is_featured?: boolean;
  has_sizes: boolean;
  category?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

const AdminMenu = () => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: true,
    is_featured: false,
    has_sizes: false
  });
  const [managingSizesForItem, setManagingSizesForItem] = useState<string | null>(null);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // If not authenticated or not admin, redirect to login
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    fetchMenuData();
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  // Track user activity and cleanup timeouts
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      // Clear all timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Connection recovery function
  const checkConnectionAndRecover = async () => {
    try {
      console.log('🔌 Admin Menu: Checking connection...');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        console.warn('🔌 Admin Menu: Connection lost, attempting recovery...');
        // Try to refresh session
        await supabase.auth.refreshSession();
        console.log('✅ Admin Menu: Connection recovered');
        return true;
      }
      return true;
    } catch (error) {
      console.error('🔌 Admin Menu: Connection recovery failed:', error);
      return false;
    }
  };

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      console.log('🍽️ Admin Menu: Fetching menu data...');

      // Add timeout for the entire operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Menu data fetch timeout')), 15000)
      );

      const fetchPromise = async () => {
        // Fetch categories with timeout
        const categoriesPromise = supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        const categoriesTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Categories query timeout')), 10000)
        );

        const { data: categoriesData, error: categoriesError } = await Promise.race([
          categoriesPromise,
          categoriesTimeoutPromise
        ]) as any;

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          setCategories([]);
        } else {
          setCategories(categoriesData || []);
        }

        // Fetch menu items with categories and timeout
        const menuItemsPromise = supabase
          .from('food_items')
          .select(`
            *,
            category:categories(name)
          `)
          .order('name');

        const menuItemsTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Menu items query timeout')), 10000)
        );

        const { data: menuData, error: menuError } = await Promise.race([
          menuItemsPromise,
          menuItemsTimeoutPromise
        ]) as any;

        if (menuError) {
          console.error('Error fetching menu items:', menuError);
          setMenuItems([]);
        } else {
          setMenuItems(menuData || []);
        }
      };

      await Promise.race([fetchPromise(), timeoutPromise]);
      console.log('✅ Admin Menu: Menu data fetched successfully');
    } catch (error) {
      console.error('Error fetching menu data:', error);
      setCategories([]);
      setMenuItems([]);
      
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('timeout')) {
        alert('Menu data loading timed out. Please check your connection and try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setNewItem({
      ...newItem,
      [e.target.name]: value
    });
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setOperationLoading('add');
      console.log('🍽️ Admin Menu: Adding new menu item...');

      // Add timeout for the operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Add item timeout')), 10000)
      );

      const addPromise = async () => {
        const imageUrl = newItem.image_url || `https://readdy.ai/api/search-image?query=delicious%20${encodeURIComponent(newItem.name)}%20food%20photography%20with%20simple%20clean%20background%2C%20professional%20food%20styling%2C%20appetizing%20presentation&width=400&height=300&seq=${Date.now()}&orientation=landscape`;

        const { data, error } = await supabase
          .from('food_items')
          .insert([{
            name: newItem.name,
            description: newItem.description,
            price: parseFloat(newItem.price),
            category_id: newItem.category_id,
            image_url: imageUrl,
            is_available: newItem.is_available,
            is_featured: newItem.is_featured || false,
            has_sizes: newItem.has_sizes
          }])
          .select(`
            *,
            category:categories(name)
          `);

        if (error) throw error;
        return data;
      };

      const data = await Promise.race([addPromise(), timeoutPromise]) as any;

      if (data) {
        setMenuItems([...menuItems, ...data]);
      }

      setNewItem({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_available: true,
        is_featured: false,
        has_sizes: false
      });
      setIsAddingItem(false);
      alert('Menu item added successfully!');
      console.log('✅ Admin Menu: Menu item added successfully');
    } catch (error) {
      console.error('Error adding menu item:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        alert('Adding menu item timed out. Please check your connection and try again.');
      } else {
        alert('Error adding menu item. Please try again.');
      }
    } finally {
      setOperationLoading(null);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category_id: item.category_id,
      image_url: item.image_url || '',
      is_available: item.is_available,
      is_featured: item.is_featured || false,
      has_sizes: item.has_sizes
    });
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItem.name || !newItem.price || !newItem.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('food_items')
        .update({
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          category_id: newItem.category_id,
          image_url: newItem.image_url,
          is_available: newItem.is_available,
          is_featured: newItem.is_featured || false,
          has_sizes: newItem.has_sizes,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id)
        .select(`
          *,
          category:categories(name)
        `);

      if (error) throw error;

      if (data) {
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? data[0] : item
        ));
      }

      setEditingItem(null);
      setNewItem({
        name: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        is_available: true,
        is_featured: false,
        has_sizes: false
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Error updating menu item. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      // First, check if the item is referenced in any orders
      const { data: orderItems, error: checkError } = await supabase
        .from('kiosk_order_items')
        .select('id')
        .eq('food_item_id', id)
        .limit(1);

      if (checkError) {
        console.error('Error checking references:', checkError);
      }

      if (orderItems && orderItems.length > 0) {
        alert('Cannot delete this item because it has been used in orders. You can disable it instead by setting it as unavailable.');
        return;
      }

      // Also check regular order items
      const { data: regularOrderItems, error: regularCheckError } = await supabase
        .from('order_items')
        .select('id')
        .eq('food_item_id', id)
        .limit(1);

      if (regularCheckError) {
        console.error('Error checking regular order references:', regularCheckError);
      }

      if (regularOrderItems && regularOrderItems.length > 0) {
        alert('Cannot delete this item because it has been used in orders. You can disable it instead by setting it as unavailable.');
        return;
      }

      // If no references found, proceed with deletion
      const { error } = await supabase
        .from('food_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMenuItems(menuItems.filter(item => item.id !== id));
      alert('Menu item deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      
      if (error.code === '23503') {
        alert('Cannot delete this item because it has been used in orders. You can disable it instead by setting it as unavailable.');
      } else {
        alert('Error deleting menu item. Please try again.');
      }
    }
  };

  const toggleAvailability = async (id: string, currentAvailability: boolean) => {
    try {
      setOperationLoading(`toggle-${id}`);
      console.log('🍽️ Admin Menu: Toggling availability for item:', id);

      // Check connection first
      const isConnected = await checkConnectionAndRecover();
      if (!isConnected) {
        alert('Connection lost. Please refresh the page and try again.');
        return;
      }

      // Add timeout for the operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Toggle availability timeout')), 8000)
      );

      const updatePromise = supabase
        .from('food_items')
        .update({ 
          is_available: !currentAvailability,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;

      if (error) throw error;

      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, is_available: !currentAvailability } : item
      ));
      console.log('✅ Admin Menu: Availability toggled successfully');
    } catch (error) {
      console.error('Error updating availability:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        alert('Updating availability timed out. Please check your connection and try again.');
      } else {
        alert('Error updating availability. Please try again.');
      }
    } finally {
      setOperationLoading(null);
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean | undefined) => {
    const newFeaturedState = !currentFeatured;
    try {
      setOperationLoading(`featured-${id}`);
      console.log('🍽️ Admin Menu: Toggling featured status for item:', id);

      // Add timeout for the operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Toggle featured timeout')), 8000)
      );

      const updatePromise = supabase
        .from('food_items')
        .update({ 
          is_featured: newFeaturedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;

      if (error) throw error;

      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, is_featured: newFeaturedState } : item
      ));
      console.log('✅ Admin Menu: Featured status toggled successfully');
    } catch (error) {
      console.error('Error updating featured status:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        alert('Updating featured status timed out. Please check your connection and try again.');
      } else {
        alert('Error updating featured status. Please try again.');
      }
    } finally {
      setOperationLoading(null);
    }
  };

  const filteredItems = filter === 'all' ? menuItems : 
    filter === 'featured' ? menuItems.filter(item => item.is_featured) :
    menuItems.filter(item => item.category_id === filter);

  // Show loading while checking authentication
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div>
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-gray-600">Manage your restaurant menu items</p>
              </div>
              <Button
                onClick={() => setIsAddingItem(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Add Item
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Size Manager Modal */}
          {managingSizesForItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <SizeManager
                  foodItemId={managingSizesForItem}
                  onClose={() => setManagingSizesForItem(null)}
                />
              </div>
            </div>
          )}

          {/* Add/Edit Item Modal */}
          {(isAddingItem || editingItem) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h2>
                
                <div className="space-y-4">
                  <Input
                    label="Item Name"
                    name="name"
                    value={newItem.name}
                    onChange={handleInputChange}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newItem.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <Input
                    label="Price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={handleInputChange}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={newItem.category_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-8"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Image URL (optional)"
                    name="image_url"
                    value={newItem.image_url}
                    onChange={handleInputChange}
                  />

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_available"
                        checked={newItem.is_available}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Available for order
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_featured"
                        checked={newItem.is_featured || false}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        <i className="ri-star-line mr-1"></i>
                        Featured item
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="has_sizes"
                        checked={newItem.has_sizes}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        <i className="ri-price-tag-3-line mr-1"></i>
                        Enable size options
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    onClick={editingItem ? handleUpdateItem : handleAddItem}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 whitespace-nowrap"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingItem(false);
                      setEditingItem(null);
                      setNewItem({
                        name: '',
                        description: '',
                        price: '',
                        category_id: '',
                        image_url: '',
                        is_available: true,
                        is_featured: false,
                        has_sizes: false
                      });
                    }}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 py-2 whitespace-nowrap"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}



          {/* Filter Tabs */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <i className="ri-list-check mr-2"></i>
                All Items ({menuItems.length})
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filter === 'featured'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <i className="ri-star-line mr-2"></i>
                Featured ({menuItems.filter(item => item.is_featured).length})
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    filter === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {category.name} ({menuItems.filter(item => item.category_id === category.id).length})
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={item.image_url || `https://readdy.ai/api/search-image?query=delicious%20food%20photography%20with%20simple%20clean%20background&width=400&height=300&seq=${item.id}&orientation=landscape`}
                    alt={item.name}
                    className="w-full h-48 object-cover object-top"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      disabled={operationLoading === `toggle-${item.id}`}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        operationLoading === `toggle-${item.id}`
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : item.is_available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {operationLoading === `toggle-${item.id}` ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500 mr-1"></div>
                          Updating...
                        </span>
                      ) : (
                        item.is_available ? 'Available' : 'Unavailable'
                      )}
                    </button>
                    {item.is_featured && (
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <i className="ri-star-fill mr-1"></i>
                        Featured
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(item.price)}</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                      {item.category?.name || 'No Category'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFeatured(item.id, item.is_featured)}
                        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          item.is_featured
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <i className={`${item.is_featured ? 'ri-star-fill' : 'ri-star-line'} mr-1`}></i>
                        {item.is_featured ? 'Featured' : 'Feature'}
                      </button>
                      
                      <button
                        onClick={() => setManagingSizesForItem(item.id)}
                        disabled={operationLoading === `sizes-${item.id}`}
                        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          operationLoading === `sizes-${item.id}`
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : item.has_sizes
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {operationLoading === `sizes-${item.id}` ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500 mr-1"></div>
                            Loading...
                          </span>
                        ) : (
                          <>
                            <i className="ri-price-tag-3-line mr-1"></i>
                            {item.has_sizes ? 'Manage Sizes' : 'Add Sizes'}
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <i className="ri-restaurant-line text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No menu items found</h3>
              <p className="text-gray-600 mb-4">No items match the selected category.</p>
              <Button
                onClick={() => setIsAddingItem(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 whitespace-nowrap"
              >
                Add First Item
              </Button>
            </div>
          )}
        </div>
    </div>
  );
};

export default AdminMenu;
