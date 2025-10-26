import { useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface POSOrderItem {
  food_item_id: string;
  size_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const usePOS = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (
    orderItems: POSOrderItem[],
    paymentMethod: 'cash' | 'card',
    totalAmount: number,
    customerName?: string,
    customerPhone?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    setIsProcessing(true);
    setError(null);

    try {
      // Generate a unique order number
      const orderNumber = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the POS order directly without setting user context
      // The RLS policies will handle the permission check
      const { data: order, error: orderError } = await supabase
        .rpc('create_pos_order', {
          p_cashier_id: user.id,
          p_order_number: orderNumber,
          p_payment_method: paymentMethod,
          p_items: orderItems,
          p_customer_name: customerName || null,
          p_customer_phone: customerPhone || null
        });

      if (orderError) throw orderError;

      return order;
    } catch (err: any) {
      console.error('Error creating POS order:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    createOrder
  };
};