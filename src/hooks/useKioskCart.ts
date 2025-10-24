import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { CartItem, FoodItem } from '../types';
import type { KioskOrder } from '../lib/supabase-types';

// Debounce helper
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const useKioskCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Cache reference
  const cartCache = useRef<{ [key: string]: CartItem[] }>({});
  const loadingRef = useRef<boolean>(false);

  type CartDataItem = {
    quantity: number;
    size_id: string | null;
    food_items: {
      id: string;
      name: string;
      description: string;
      price: number;
      category_id: string;
      image_url: string;
      is_available: boolean;
      is_featured: boolean;
      has_sizes: boolean;
      preparation_time?: number;
      category?: {
        name: string;
      };
    };
    item_sizes: {
      id: string;
      name: string;
      price: number;
    } | null;
  }

  const processCartData = (cartData: any[]): CartItem[] => {
    return (cartData as unknown as CartDataItem[])
      .filter(item => item.food_items && (!item.size_id || item.item_sizes))
      .map(item => ({
        id: item.food_items.id,
        name: item.food_items.name,
        description: item.food_items.description,
        price: item.food_items.price,
        category_id: item.food_items.category_id,
        image_url: item.food_items.image_url,
        is_available: item.food_items.is_available,
        is_featured: item.food_items.is_featured,
        has_sizes: item.food_items.has_sizes,
        preparation_time: item.food_items.preparation_time || 0,
        category: item.food_items.category,
        quantity: item.quantity,
        size_id: item.size_id || null,
        size_name: item.item_sizes?.name || null,
        size_price: item.item_sizes?.price || null
      }));
  };

  const loadCartFromDatabase = useCallback(async () => {
    if (!user?.id || loadingRef.current) {
      console.log('❌ No user ID or already loading');
      return;
    }

    // Use cached data first
    if (cartCache.current[user.id]) {
      console.log('📦 Using cached cart data');
      setItems(cartCache.current[user.id]);
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      console.log('🔍 Querying database for user:', user.id);
      
      const { data: cartData, error } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          size_id,
          food_items (
            id,
            name,
            price,
            image_url,
            category_id,
            description,
            is_available,
            is_featured,
            has_sizes,
            preparation_time,
            categories (
              name
            )
          ),
          item_sizes (
            id,
            name,
            price
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const processedItems = processCartData(cartData || []);
      
      // Update cache
      cartCache.current[user.id] = processedItems;
      
      setItems(processedItems);
      console.log('✅ Cart loaded successfully:', processedItems.length, 'items');
    } catch (error) {
      console.error('❌ Error loading cart:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  // Load cart on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadCartFromDatabase();
    } else {
      setItems([]);
      cartCache.current = {};
    }
  }, [user?.id, loadCartFromDatabase]);

  const addToCart = async (foodItem: FoodItem, sizeId?: string, quantity: number = 1) => {
    if (!user?.id) {
      console.error('❌ User not authenticated');
      return;
    }

    try {
      setIsLoading(true);

      // Check if item already exists in cart
      const existingItemIndex = items.findIndex(item => 
        item.id === foodItem.id && item.size_id === (sizeId || null)
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const newQuantity = items[existingItemIndex].quantity + quantity;
        await updateQuantity(items[existingItemIndex].id, newQuantity, sizeId);
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            food_item_id: foodItem.id,
            size_id: sizeId || null,
            quantity
          });

        if (error) throw error;

        // Reload cart to get updated data
        await loadCartFromDatabase();
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (foodItemId: string, sizeId?: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('food_item_id', foodItemId)
        .eq('size_id', sizeId || null);

      if (error) throw error;

      // Update local state immediately
      setItems(prev => prev.filter(item => 
        !(item.id === foodItemId && item.size_id === (sizeId || null))
      ));

      // Update cache
      if (cartCache.current[user.id]) {
        cartCache.current[user.id] = cartCache.current[user.id].filter(item => 
          !(item.id === foodItemId && item.size_id === (sizeId || null))
        );
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (foodItemId: string, newQuantity: number, sizeId?: string) => {
    if (!user?.id) return;

    if (newQuantity <= 0) {
      await removeFromCart(foodItemId, sizeId);
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('user_id', user.id)
        .eq('food_item_id', foodItemId)
        .eq('size_id', sizeId || null);

      if (error) throw error;

      // Update local state immediately
      setItems(prev => prev.map(item => 
        item.id === foodItemId && item.size_id === (sizeId || null)
          ? { ...item, quantity: newQuantity }
          : item
      ));

      // Update cache
      if (cartCache.current[user.id]) {
        cartCache.current[user.id] = cartCache.current[user.id].map(item => 
          item.id === foodItemId && item.size_id === (sizeId || null)
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
      
      // Clear cache
      if (cartCache.current[user.id]) {
        delete cartCache.current[user.id];
      }
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const itemPrice = item.size_id ? (item.price + (item.size_price || 0)) : item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return items.length;
  };

  const createKioskOrder = async (orderData: {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerAddress?: string;
    orderType: 'pickup' | 'delivery';
    paymentMethod: 'cash' | 'card';
    notes?: string;
    kioskId?: string;
  }): Promise<KioskOrder> => {
    try {
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Use the create_kiosk_order function
      const { data: order, error: orderError } = await supabase
        .rpc('create_kiosk_order', {
          p_customer_name: orderData.customerName,
          p_customer_email: orderData.customerEmail || null,
          p_customer_phone: orderData.customerPhone,
          p_customer_address: orderData.customerAddress || null,
          p_order_type: orderData.orderType,
          p_payment_method: orderData.paymentMethod,
          p_total_amount: getTotalPrice(),
          p_notes: orderData.notes || null,
          p_kiosk_id: orderData.kioskId || null,
          p_order_items: items.map(item => ({
            food_item_id: item.id,
            size_id: item.size_id,
            quantity: item.quantity,
            unit_price: item.size_id ? (item.price + (item.size_price || 0)) : item.price,
            total_price: (item.size_id ? (item.price + (item.size_price || 0)) : item.price) * item.quantity
          }))
        });

      if (orderError) throw orderError;

      // Clear the cart after successful order creation
      await clearCart();

      return order;
    } catch (error) {
      console.error('Error creating kiosk order:', error);
      throw error;
    }
  };

  return {
    items,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    createKioskOrder,
    // Add aliases for compatibility
    cart: items,
    getCartTotal: getTotalPrice,
    total: getTotalPrice()
  };
};