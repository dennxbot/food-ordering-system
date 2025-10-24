import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/base/Button';
import Input from '../../../components/base/Input';
import AdminSidebar from '../../../components/feature/AdminSidebar';

interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

const AdminCategories = () => {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    is_active: true
  });

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;

    // If not authenticated or not admin, redirect to login
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    fetchCategories();
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      // Fetch categories with item count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          food_items(count)
        `)
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        setCategories([]);
      } else {
        // Transform the data to include item count
        const categoriesWithCount = categoriesData?.map(category => ({
          ...category,
          item_count: category.food_items?.[0]?.count || 0
        })) || [];
        setCategories(categoriesWithCount);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Please enter a category name.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name.trim(),
          is_active: newCategory.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCategories([...categories, { ...data, item_count: 0 }]);
      }

      setIsAddingCategory(false);
      setNewCategory({ name: '', is_active: true });
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category. Please try again.');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      is_active: category.is_active
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategory.name.trim()) {
      alert('Please enter a category name.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: newCategory.name.trim(),
          is_active: newCategory.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCategory.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id 
            ? { ...data, item_count: cat.item_count } 
            : cat
        ));
      }

      setEditingCategory(null);
      setNewCategory({ name: '', is_active: true });
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id: string, itemCount: number = 0) => {
    if (itemCount > 0) {
      alert(`Cannot delete this category because it has ${itemCount} menu item(s). Please move or delete the items first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category. Please try again.');
    }
  };

  const toggleCategoryStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setCategories(categories.map(cat => 
        cat.id === id ? { ...cat, is_active: !currentStatus } : cat
      ));
    } catch (error) {
      console.error('Error updating category status:', error);
      alert('Error updating category status. Please try again.');
    }
  };

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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
                <p className="text-gray-600">Manage your menu categories</p>
              </div>
              <Button
                onClick={() => setIsAddingCategory(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>
                Add Category
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Add/Edit Category Modal */}
          {(isAddingCategory || editingCategory) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h2>
                  <button
                    onClick={() => {
                      setIsAddingCategory(false);
                      setEditingCategory(null);
                      setNewCategory({ name: '', is_active: true });
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <Input
                      name="name"
                      value={newCategory.name}
                      onChange={handleInputChange}
                      placeholder="Enter category name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={newCategory.is_active}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Active Category</span>
                        <p className="text-xs text-gray-600">Category will be visible to customers</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <i className={`${editingCategory ? 'ri-save-line' : 'ri-add-line'} mr-2`}></i>
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingCategory(false);
                      setEditingCategory(null);
                      setNewCategory({ name: '', is_active: true });
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    <i className="ri-close-line mr-2"></i>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Categories ({categories.length})
                </h2>
                <div className="text-sm text-gray-500">
                  {categories.filter(cat => cat.is_active).length} active, {categories.filter(cat => !cat.is_active).length} inactive
                </div>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="p-12 text-center">
                <i className="ri-folder-line text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No categories found</h3>
                <p className="text-gray-600 mb-6">Create your first category to organize your menu items.</p>
                <Button
                  onClick={() => setIsAddingCategory(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
                >
                  <i className="ri-add-line mr-2"></i>
                  Add First Category
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                category.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {category.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {category.item_count || 0} items
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Created: {new Date(category.created_at).toLocaleDateString()}
                            {category.updated_at !== category.created_at && (
                              <span className="ml-2">
                                • Updated: {new Date(category.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            category.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <i className={`${category.is_active ? 'ri-eye-off-line' : 'ri-eye-line'} mr-1`}></i>
                          {category.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <i className="ri-edit-line text-lg"></i>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.item_count)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;