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
      return; // Don't proceed with database loading if we have cached data
    }

    loadingRef.current = true;
    setIsLoading(true);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Kiosk cart loading timeout - setting loading to false');
      loadingRef.current = false;
      setIsLoading(false);
    }, 20000); // 20 second timeout (increased from 15s)

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
      
      console.log('🛒 useKioskCart: Processing cart data', {
        rawData: cartData?.length || 0,
        processedItems: processedItems.length,
        sampleItem: processedItems[0]
      });
      
      // Update cache
      cartCache.current[user.id] = processedItems;
      
      setItems(processedItems);
      console.log('✅ Cart loaded successfully:', processedItems.length, 'items');
    } catch (error) {
      console.error('❌ Error loading cart:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  // Load cart on mount and when user changes
  useEffect(() => {
    console.log('🛒 useKioskCart: useEffect triggered', {
      userId: user?.id,
      currentItems: items.length
    });
    
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

    // Prevent multiple rapid calls
    if (isLoading) {
      console.log('🛒 useKioskCart: Already processing, skipping add to cart');
      return;
    }

    console.log('🛒 useKioskCart: Adding item to cart', {
      foodItemId: foodItem.id,
      foodItemName: foodItem.name,
      sizeId,
      quantity,
      currentItems: items.length
    });

    try {
      setIsLoading(true);

      // Ensure sizeId is properly handled - convert undefined to null, but keep null as null
      const actualSizeId = sizeId === undefined ? null : sizeId;

      // Check if item already exists in cart
      const existingItemIndex = items.findIndex(item => 
        item.id === foodItem.id && item.size_id === actualSizeId
      );

      if (existingItemIndex >= 0) {
        // Update existing item
        const newQuantity = items[existingItemIndex].quantity + quantity;
        await updateQuantity(items[existingItemIndex].id, newQuantity, actualSizeId);
      } else {
        // Check if item already exists in database to prevent duplicates
        let checkQuery = supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('food_item_id', foodItem.id);

        // Handle size_id condition properly
        if (actualSizeId === null) {
          // For items without size, use filter() to check for NULL
          checkQuery = checkQuery.filter('size_id', 'is', null);
        } else {
          // For items with size, use eq() to check for specific UUID
          checkQuery = checkQuery.eq('size_id', actualSizeId);
        }

        const { data: existingCartItem, error: checkError } = await checkQuery.single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw checkError;
        }

        if (existingCartItem) {
          // Item exists in database, update quantity
          const newQuantity = existingCartItem.quantity + quantity;
          await updateQuantity(foodItem.id, newQuantity, actualSizeId);
        } else {
          // Add new item
          const { error } = await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              food_item_id: foodItem.id,
              size_id: actualSizeId,
              quantity
            });

          if (error) throw error;

          console.log('🛒 useKioskCart: Item inserted successfully, reloading cart...');
          
          // Reload cart to get updated data
          await loadCartFromDatabase();
          
          console.log('🛒 useKioskCart: Cart reloaded after adding item');
        }
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (foodItemId: string, newQuantity: number, sizeId?: string) => {
    if (!user?.id) return;

    console.log('🛒 useKioskCart: Updating quantity', {
      foodItemId,
      newQuantity,
      sizeId,
      currentItems: items.length
    });

    try {
      setIsLoading(true);

      // Build the query conditionally to handle null size_id properly
      let query = supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('user_id', user.id)
        .eq('food_item_id', foodItemId);

      // Handle size_id condition properly
      if (sizeId === undefined || sizeId === null) {
        // For items without size, use filter() to check for NULL
        query = query.filter('size_id', 'is', null);
      } else {
        // For items with size, use eq() to check for specific UUID
        query = query.eq('size_id', sizeId);
      }

      const { error } = await query;

      if (error) throw error;

      // Update local state immediately
      const actualSizeId = sizeId === undefined ? null : sizeId;
      const newItems = items.map(item => 
        item.id === foodItemId && item.size_id === actualSizeId
          ? { ...item, quantity: newQuantity }
          : item
      );
      
      console.log('🛒 useKioskCart: Items after quantity update', {
        before: items.length,
        after: newItems.length,
        updatedQuantity: newQuantity
      });
      
      setItems(newItems);

      // Update cache
      if (cartCache.current[user.id]) {
        cartCache.current[user.id] = cartCache.current[user.id].map(item => 
          item.id === foodItemId && item.size_id === actualSizeId
            ? { ...item, quantity: newQuantity }
            : item
        );
        console.log('🛒 useKioskCart: Cache updated after quantity update');
      }
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (foodItemId: string, sizeId?: string) => {
    if (!user?.id) return;

    console.log('🛒 useKioskCart: Removing item from cart', {
      foodItemId,
      sizeId,
      currentItems: items.length
    });

    try {
      setIsLoading(true);

      // Build the query conditionally to handle null size_id properly
      let query = supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('food_item_id', foodItemId);

      // Handle size_id condition properly
      if (sizeId === undefined || sizeId === null) {
        // For items without size, use filter() to check for NULL
        query = query.filter('size_id', 'is', null);
      } else {
        // For items with size, use eq() to check for specific UUID
        query = query.eq('size_id', sizeId);
      }

      const { error } = await query;

      if (error) throw error;

      // Update local state immediately
      const actualSizeId = sizeId === undefined ? null : sizeId;
      const newItems = items.filter(item => 
        !(item.id === foodItemId && item.size_id === actualSizeId)
      );
      
      console.log('🛒 useKioskCart: Items after removal', {
        before: items.length,
        after: newItems.length,
        removed: items.length - newItems.length
      });
      
      setItems(newItems);

      // Update cache
      if (cartCache.current[user.id]) {
        cartCache.current[user.id] = cartCache.current[user.id].filter(item => 
          !(item.id === foodItemId && item.size_id === actualSizeId)
        );
        console.log('🛒 useKioskCart: Cache updated after removal');
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
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
        console.log('🗑️ Kiosk cart cache cleared for user:', user.id);
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

      // Prepare items for RPC call
      const rpcItems = items.map(item => ({
        food_item_id: item.id,
        size_id: (item.size_id && item.size_id !== 'undefined') ? item.size_id : null,
        quantity: item.quantity,
        unit_price: item.size_id ? (item.price + (item.size_price || 0)) : item.price
      }));

      console.log('🛒 useKioskCart: Creating kiosk order with items', {
        itemsCount: items.length,
        rpcItems,
        orderData
      });

      // Use the create_kiosk_order function
      const { data: order, error: orderError } = await supabase
        .rpc('create_kiosk_order', {
          p_customer_name: orderData.customerName,
          p_items: rpcItems,
          p_customer_email: orderData.customerEmail || 'N/A',
          p_customer_phone: orderData.customerPhone,
          p_order_type: orderData.orderType,
          p_payment_method: orderData.paymentMethod,
          p_notes: orderData.notes || null,
          p_kiosk_id: orderData.kioskId || null
        });

      if (orderError) throw orderError;

      console.log('🛒 useKioskCart: Order created successfully', {
        orderId: order,
        orderData: orderData,
        itemsCount: items.length,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          size_id: item.size_id,
          price: item.price
        }))
      });

      // Verify that order items were actually inserted
      const { data: insertedItems, error: itemsCheckError } = await supabase
        .from('kiosk_order_items')
        .select('*')
        .eq('kiosk_order_id', order);

      if (itemsCheckError) {
        console.error('❌ Error checking inserted order items:', itemsCheckError);
      } else {
        console.log('🛒 useKioskCart: Order items verification', {
          orderId: order,
          insertedItemsCount: insertedItems?.length || 0,
          insertedItems: insertedItems
        });
      }

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