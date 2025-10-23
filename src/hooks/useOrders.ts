
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { isWithinCancellationWindow, isStatusCancellable, ORDER_CONFIG } from '../utils/orderHelpers';

interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: string | null;
  order_type: 'delivery' | 'pickup' | 'pos';
  payment_method: 'cash' | 'card' | 'online';
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  food_item_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  food_items?: {
    name: string;
    image_url: string | null;
  };
}

interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  users?: {
    full_name: string;
  };
}

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  order_status_history?: OrderStatusHistory[];
}

export const useOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      // Set user context for RLS if user is authenticated
      if (user) {
        await supabase.rpc('set_user_context', { 
          user_id: user.id, 
          user_role: user.role 
        });
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            food_items (
              name,
              image_url
            )
          ),
          order_status_history (
            *,
            users (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cache for user orders
  const ordersCache = useRef<{ [key: string]: { data: OrderWithItems[]; timestamp: number } }>({});
  const CACHE_DURATION = 30000; // 30 seconds

  const fetchUserOrders = useCallback(async (userId: string) => {
    try {
      // Check cache first
      const now = Date.now();
      const cached = ordersCache.current[userId];
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            food_items (
              name,
              image_url
            )
          ),
          order_status_history (
            *,
            users (
              full_name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update cache
      const orderData = data || [];
      ordersCache.current[userId] = {
        data: orderData,
        timestamp: Date.now()
      };
      return orderData;

    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'order_status_history' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: Order['status'], notes?: string) => {
    try {
      // Set user context for RLS
      if (user) {
        await supabase.rpc('set_user_context', { 
          user_id: user.id, 
          user_role: user.role 
        });
      }

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Add status history entry
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status,
          changed_by: user?.id || null,
          notes: notes || `Status changed to ${status}`
        });

      if (historyError) throw historyError;
      
      // Refresh orders
      await fetchOrders();

    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  // Cache for individual orders
  const orderCache = useRef<{ [key: string]: { data: OrderWithItems | null; timestamp: number } }>({});

  const getOrderById = async (orderId: string) => {
    try {
      // Check cache first
      const now = Date.now();
      const cached = orderCache.current[orderId];
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('📦 Using cached order data');
        return cached.data;
      }

      console.log('🔍 Fetching order from database:', orderId);

      // Set user context for RLS
      if (user) {
        console.log('🔐 Setting user context for RLS');
        await supabase.rpc('set_user_context', { 
          user_id: user.id, 
          user_role: user.role 
        });
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            food_items (
              name,
              image_url
            )
          ),
          order_status_history (
            *,
            users (
              full_name
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ Error fetching order:', error);
        throw error;
      }

      if (!data) {
        console.log('⚠️ No order data found');
        return null;
      }

      console.log('✅ Order data fetched successfully');

      // Update cache
      orderCache.current[orderId] = {
        data: data,
        timestamp: Date.now()
      };

      return data;

    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => 
      order.created_at.startsWith(today)
    );

    return {
      totalOrders: todayOrders.length,
      totalSales: todayOrders.reduce((sum, order) => sum + order.total_amount, 0),
      pendingOrders: todayOrders.filter(order => order.status === 'pending').length,
      preparingOrders: todayOrders.filter(order => order.status === 'preparing').length,
      readyOrders: todayOrders.filter(order => order.status === 'ready').length,
      outForDeliveryOrders: todayOrders.filter(order => order.status === 'out_for_delivery').length,
      completedOrders: todayOrders.filter(order => order.status === 'completed').length,
      cancelledOrders: todayOrders.filter(order => order.status === 'cancelled').length,
    };
  };

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  const getOrderStatusHistory = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    return order?.order_status_history || [];
  };

  const getAllOrderStatuses = () => {
    return ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'] as const;
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      // Get the order first
      const order = await getOrderById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if user has permission to cancel
      if (user?.role !== 'admin' && order.user_id !== user?.id) {
        throw new Error('Unauthorized to cancel this order');
      }

      // For customers, check cancellation window and status
      if (user?.role !== 'admin') {
        // Check if within cancellation window
        if (!isWithinCancellationWindow(order.created_at)) {
          throw new Error(`Cancellation window of ${ORDER_CONFIG.CANCELLATION_WINDOW} minutes has expired`);
        }

        // Check if status allows cancellation
        if (!isStatusCancellable(order.status)) {
          throw new Error('Order cannot be cancelled in its current status');
        }

        // Check daily cancellation limit
        const today = new Date().toISOString().split('T')[0];
        const { data: cancellations, error: countError } = await supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'cancelled')
          .gte('created_at', today);

        if (countError) throw countError;

        if ((cancellations?.length || 0) >= ORDER_CONFIG.MAX_CANCELLATIONS_PER_DAY) {
          throw new Error(`Maximum ${ORDER_CONFIG.MAX_CANCELLATIONS_PER_DAY} cancellations per day reached`);
        }
      }

      // Start a transaction
      const { data: updatedOrder, error: updateError } = await supabase
        .rpc('cancel_order', { 
          p_order_id: orderId,
          p_reason: reason,
          p_cancelled_by: user?.id
        });

      if (updateError) throw updateError;

      // Update local cache
      if (orderCache.current[orderId]) {
        orderCache.current[orderId] = {
          data: { ...order, status: 'cancelled' },
          timestamp: Date.now()
        };
      }

      // Refetch orders to update the list
      await fetchOrders();

      return updatedOrder;
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      throw new Error(error.message || 'Failed to cancel order');
    }
  };

  return {
    orders,
    isLoading,
    fetchOrders,
    fetchUserOrders,
    updateOrderStatus,
    getOrderById,
    getTodayStats,
    getOrdersByStatus,
    getOrderStatusHistory,
    getAllOrderStatuses,
    cancelOrder
  };
};
