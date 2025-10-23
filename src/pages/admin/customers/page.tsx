
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../utils/currency';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/base/Button';
import AdminSidebar from '../../../components/feature/AdminSidebar';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  created_at: string;
}

interface CustomerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_items: {
    food_items: {
      name: string;
    };
    quantity: number;
  }[];
}
//yutniman mauma nakon hahaha arayko! 
const AdminCustomers = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Urayen ti auth nga ag-load sakbay ti panag-check.
    if (isLoading) return;


    // No saan nga naka-authenticate wenno saan nga admin, i-redirect iti login.
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }

    fetchCustomers();
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total_amount, created_at, status');

      if (ordersError) throw ordersError;

      // Calculate customer statistics
      const customersWithStats = users?.map(user => {
        const userOrders = orders?.filter(order => order.user_id === user.id) || [];
        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0);
        const lastOrder = userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        return {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          contact_number: user.contact_number || 'N/A',
          address: user.address || 'N/A',
          totalOrders,
          totalSpent,
          lastOrderDate: lastOrder ? lastOrder.created_at : user.created_at,
          created_at: user.created_at
        };
      }) || [];

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerOrders = async (customer: Customer) => {
    try {
      setSelectedCustomer(customer);
      
      // Fetch customer's orders with order items and food item details
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          order_items (
            quantity,
            food_item_id,
            food_items!order_items_food_item_id_fkey (
              name
            )
          )
        `)
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedOrders = orders?.map(order => ({
        ...order,
        order_items: order.order_items?.map(item => ({
          ...item,
          food_items: Array.isArray(item.food_items) ? item.food_items[0] : item.food_items
        }))
      })) || [];

      setCustomerOrders(transformedOrders);
      setShowCustomerOrders(true);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600">Manage all customer information</p>
          </div>
        </div>

        {showCustomerOrders && selectedCustomer ? (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedCustomer.full_name}'s Orders</h2>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                </div>
                <Button
                  onClick={() => setShowCustomerOrders(false)}
                  variant="outline"
                  className="border-gray-300 text-gray-700 px-4 py-2 whitespace-nowrap"
                >
                  Back to Customers
                </Button>
              </div>

              <div className="space-y-4">
                {customerOrders.length > 0 ? (
                  customerOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                          <div className="space-y-1">
                            {order.order_items?.map((item, index) => (
                              <p key={index} className="text-sm text-gray-700">
                                • {item.quantity}x {item.food_items?.name || 'Unknown Item'}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{formatCurrency(order.total_amount)}</p>
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-shopping-bag-line text-4xl mb-4"></i>
                    <p>No orders found for this customer</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm p-6 border border-blue-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Total Customers</p>
                    <p className="text-3xl font-bold text-blue-900">{customers.length}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      <i className="ri-user-add-line mr-1"></i>
                      Active users
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="ri-user-line text-2xl text-white"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm p-6 border border-green-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-green-900">
                      {customers.reduce((sum, customer) => sum + customer.totalOrders, 0)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      <i className="ri-shopping-bag-line mr-1"></i>
                      All customers
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="ri-shopping-bag-line text-2xl text-white"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm p-6 border border-purple-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {formatCurrency(customers.reduce((sum, customer) => sum + customer.totalSpent, 0))}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      <i className="ri-money-peso-circle-line mr-1"></i>
                      Lifetime value
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="ri-money-peso-circle-line text-2xl text-white"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm p-6 border border-orange-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 mb-1">Avg Order Value</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {customers.length > 0 && customers.reduce((sum, customer) => sum + customer.totalOrders, 0) > 0
                        ? formatCurrency(customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / 
                           customers.reduce((sum, customer) => sum + customer.totalOrders, 0))
                        : formatCurrency(0)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      <i className="ri-user-star-line mr-1"></i>
                      Per order
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="ri-user-star-line text-2xl text-white"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search customers by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg">
                    <i className="ri-download-line"></i>
                    Export
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg">
                    <i className="ri-filter-line"></i>
                    Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <i className="ri-team-line text-blue-500 mr-3"></i>
                  Customer Directory
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Customer</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Contact</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Orders</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Total Spent</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Last Order</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers
                      .filter(customer => 
                        customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((customer) => (
                        <tr key={customer.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                                <span className="text-white font-bold text-sm">
                                  {customer.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{customer.full_name}</p>
                                <p className="text-sm text-gray-600">{customer.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{customer.contact_number}</p>
                              <p className="text-xs text-gray-500">{customer.address}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                <i className="ri-shopping-bag-line mr-1"></i>
                                {customer.totalOrders}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(customer.totalSpent)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-600">
                              {customer.totalOrders > 0 
                                ? new Date(customer.lastOrderDate).toLocaleDateString()
                                : 'No orders yet'
                              }
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <Button
                              onClick={() => viewCustomerOrders(customer)}
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 text-sm rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              <i className="ri-eye-line mr-2"></i>
                              View Orders
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              {customers.filter(customer => 
                customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-user-search-line text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No customers found</h3>
                  <p className="text-gray-600">Try adjusting your search terms.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
