import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { CartItem, FoodItem } from '../types';

// Debounce helper
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const useCart = () => {
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
            is_featured,
            is_available,
            preparation_time,
            has_sizes
          ),
          item_sizes (
            id,
            name,
            price
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      if (!cartData || cartData.length === 0) {
        console.log('✅ Empty cart for user - checking localStorage for migration');
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (parsedCart.length > 0) {
            console.log('🔄 Migrating localStorage cart to database:', parsedCart);
            await migrateCartToDatabase(parsedCart);
            return;
          }
        }
        const emptyCart: CartItem[] = [];
        cartCache.current[user.id] = emptyCart;
        setItems(emptyCart);
        return;
      }

      const processedItems = processCartData(cartData);
      console.log('✅ Processed cart items for user:', processedItems);
      
      // Update cache and state
      cartCache.current[user.id] = processedItems;
      setItems(processedItems);

    } catch (error) {
      console.error('❌ Error loading cart from database:', error);
      loadCartFromLocalStorage();
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load cart and subscribe to changes when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('🔍 Loading cart for new user:', user.id);
      loadCartFromDatabase();

      // Subscribe to cart changes
      const cartSubscription = supabase
        .channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('🔄 Cart changed:', payload);

            // Get the latest cart data with all related information
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
                  is_featured,
                  is_available,
                  preparation_time,
                  has_sizes
                ),
                item_sizes (
                  id,
                  name,
                  price
                )
              `)
              .eq('user_id', user.id);

            if (error) {
              console.error('❌ Error fetching updated cart:', error);
              return;
            }

            if (!cartData) {
              setItems([]);
              cartCache.current[user.id] = [];
              return;
            }

            // Process the cart data
            const processedItems = (cartData as unknown as CartDataItem[]).map(item => ({
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

            // Update state and cache
            setItems(processedItems);
            cartCache.current[user.id] = processedItems;
          }
        )
        .subscribe();

      return () => {
        cartSubscription.unsubscribe();
      };
    } else {
      console.log('📱 Loading cart from localStorage (no user)');
      loadCartFromLocalStorage();
    }
  }, [user?.id, loadCartFromDatabase]);

  const loadCartFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('📱 Loaded from localStorage:', parsedCart);
        setItems(parsedCart);
      } else {
        console.log('📱 No localStorage cart found');
        setItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
      setItems([]);
    }
  };

  const migrateCartToDatabase = async (localCart: CartItem[]) => {
    if (!user?.id || localCart.length === 0) return;

    try {
      console.log('🔄 Starting cart migration to database');
      
      // Clear any existing cart items for this user first
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Insert new cart items
      const cartItemsToInsert = localCart.map(item => ({
        user_id: user.id,
        food_item_id: item.id,
        quantity: item.quantity,
        size_id: item.size_id
      }));

      const { error } = await supabase
        .from('cart_items')
        .insert(cartItemsToInsert);

      if (error) {
        console.error('❌ Migration error:', error);
        return;
      }

      console.log('✅ Cart migrated successfully');
      setItems(localCart);
      
      // Clear localStorage after successful migration
      localStorage.removeItem('cart');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  };

  const addToCart = async (
    item: FoodItem,
    quantity: number = 1,
    sizeId: string | null = null,
    sizeName: string | null = null,
    sizePrice: number | null = null
  ) => {
    console.log('➕ Adding to cart:', item.name, 'quantity:', quantity, 'size:', sizeName);

    if (!user?.id) {
      // Handle local storage cart
      const newItems = items.find(cartItem => 
        cartItem.id === item.id && cartItem.size_id === sizeId
      )
        ? items.map(cartItem =>
            cartItem.id === item.id && cartItem.size_id === sizeId
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem
          )
        : [...items, { 
            ...item, 
            quantity,
            size_id: sizeId,
            size_name: sizeName,
            size_price: sizePrice
          }];
      
      setItems(newItems);
      localStorage.setItem('cart', JSON.stringify(newItems));
      return;
    }

    // Optimistic update
    const newItem: CartItem = {
      ...item,
      quantity,
      size_id: sizeId,
      size_name: sizeName,
      size_price: sizePrice
    };

    const existingItemIndex = items.findIndex(
      cartItem => cartItem.id === item.id && cartItem.size_id === sizeId
    );

    const optimisticItems = existingItemIndex >= 0
      ? items.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        )
      : [...items, newItem];

      // Update cache and state immediately
      cartCache.current[user.id] = optimisticItems;
      
      // Use state update callback to ensure state is updated
      await new Promise<void>(resolve => {
        setItems(optimisticItems);
        // Wait for next render to ensure state is updated
        setTimeout(resolve, 0);
      });

      try {
        // Try to insert first
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            food_item_id: item.id,
            quantity: quantity,
            size_id: sizeId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        // If we get a unique constraint error, it means the item exists
        if (insertError && insertError.code === '23505') {
          // Update the quantity of the existing item
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ 
              // Use a direct number addition since we can't use raw SQL
              quantity: quantity,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('food_item_id', item.id)
            .is('size_id', sizeId === null ? null : sizeId);

          if (updateError) throw updateError;
        } else if (insertError) {
          // If it's any other error, throw it
          throw insertError;
        }

        return true; // Operation succeeded
      } catch (error: any) {
        console.error('❌ Error adding to cart:', error);
        // Revert optimistic update on error
        const revertedItems = cartCache.current[user.id] || items;
        setItems(revertedItems);
        
        // Throw the error to be handled by the caller
        throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    console.log('🗑️ Removing from cart:', itemId);
    
    if (!user?.id) {
      // Handle local storage cart
      const newItems = items.filter(item => item.id !== itemId);
      setItems(newItems);
      localStorage.setItem('cart', JSON.stringify(newItems));
      return;
    }

    // Get all sizes for this item first
    const itemsToRemove = items.filter(item => item.id === itemId);
    if (itemsToRemove.length === 0) return;

    // Optimistic update
    const previousItems = [...items];
    const newItems = items.filter(item => item.id !== itemId);
    
    // Update cache and state immediately
    cartCache.current[user.id] = newItems;
    setItems(newItems);

    try {
      // Delete all size variants in a single query
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('food_item_id', itemId);

      if (error) throw error;

      // Trigger an immediate cart refresh
      const { data: cartData, error: refreshError } = await supabase
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
            is_featured,
            is_available,
            preparation_time,
            has_sizes
          ),
          item_sizes (
            id,
            name,
            price
          )
        `)
        .eq('user_id', user.id);

      if (refreshError) throw refreshError;

      const processedItems = cartData ? (cartData as unknown as CartDataItem[]).map(item => ({
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
      })) : [];

      // Update state and cache with fresh data
      cartCache.current[user.id] = processedItems;
      setItems(processedItems);
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      // Revert optimistic update on error
      cartCache.current[user.id] = previousItems;
      setItems(previousItems);
      alert('Failed to remove item from cart. Please try again.');
    }
  };

  // Debounced update function
  const debouncedUpdate = useRef(
    debounce(async (userId: string, itemId: string, quantity: number) => {
      try {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', userId)
          .eq('food_item_id', itemId);

        if (error) throw error;
      } catch (error) {
        console.error('❌ Error updating quantity:', error);
        alert('Failed to update quantity. Please try again.');
        // Reload cart to ensure consistency
        loadCartFromDatabase();
      }
    }, 500)
  ).current;

  const updateQuantity = async (itemId: string, quantity: number) => {
    console.log('🔄 Updating quantity for:', itemId, 'to:', quantity);
    
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (!user?.id) {
      // Handle local storage cart
      const newItems = items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      setItems(newItems);
      localStorage.setItem('cart', JSON.stringify(newItems));
      return;
    }

    // Optimistic update
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );

    // Update cache and state immediately
    cartCache.current[user.id] = newItems;
    setItems(newItems);

    // Debounced database update
    debouncedUpdate(user.id, itemId, quantity);
  };

  const clearCart = async () => {
    console.log('🧹 Clearing cart');
    
    // Update state immediately
    setItems([]);
    
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
          
        if (error) {
          console.error('❌ Error clearing cart from database:', error);
        } else {
          console.log('✅ Cart cleared from database');
        }
      } catch (error) {
        console.error('❌ Error clearing cart from database:', error);
      }
    } else {
      localStorage.removeItem('cart');
      console.log('✅ Cart cleared from localStorage');
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      // For items with size, add base price and size price
      const itemPrice = item.size_id ? (item.price + (item.size_price || 0)) : item.price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    // Return the number of unique items in cart, not the total quantity
    return items.length;
  };

  const createOrder = async (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    orderType: 'delivery' | 'pickup';
    paymentMethod: 'cash' | 'card';
    userId: string;
  }) => {
    try {
      // Start a Supabase transaction
      const { data: order, error: orderError } = await supabase
        .rpc('create_order_with_items', {
          p_user_id: orderData.userId,
          p_customer_name: orderData.customerName,
          p_customer_email: orderData.customerEmail,
          p_customer_phone: orderData.customerPhone,
          p_customer_address: orderData.customerAddress,
          p_order_type: orderData.orderType,
          p_payment_method: orderData.paymentMethod,
          p_total_amount: getTotalPrice(),
          p_order_items: items.map(item => ({
            food_item_id: item.id,
            size_id: item.size_id,
            quantity: item.quantity,
            unit_price: item.size_id ? (item.price + (item.size_price || 0)) : item.price,
            total_price: (item.size_id ? (item.price + (item.size_price || 0)) : item.price) * item.quantity
          }))
        });

      if (orderError) throw orderError;

      // Get the complete order with items in a single query
      const { data: completeOrder, error: completeOrderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            food_item_id,
            size_id,
            quantity,
            unit_price,
            total_price,
            food_items (
              id,
              name,
              image_url,
              description
            ),
            item_sizes (
              id,
              name,
              price
            )
          )
        `)
        .eq('id', order.id)
        .single();

      if (completeOrderError) throw completeOrderError;

      // Clear the cart in parallel with getting the order details
      await Promise.all([
        clearCart(),
        // Subscribe to order status changes
        supabase
          .channel(`order_${order.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${order.id}`
          }, () => {
            // Trigger a refresh of the order details
            supabase
              .from('orders')
              .select(`
                *,
                order_items (
                  id,
                  food_item_id,
                  size_id,
                  quantity,
                  unit_price,
                  total_price,
                  food_items (
                    id,
                    name,
                    image_url,
                    description
                  ),
                  item_sizes (
                    id,
                    name,
                    price
                  )
                )
              `)
              .eq('id', order.id)
              .single();
          })
          .subscribe()
      ]);

      return completeOrder;
    } catch (error) {
      console.error('Error creating order:', error);
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
    createOrder,
    // Add aliases for compatibility
    cart: items,
    getCartTotal: getTotalPrice,
    total: getTotalPrice()
  };
};