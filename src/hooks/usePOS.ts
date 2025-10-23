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
    totalAmount: number
  ) => {
    if (!user) throw new Error('User not authenticated');

    setIsProcessing(true);
    setError(null);

    try {
      // Create the POS order directly without setting user context
      // The RLS policies will handle the permission check
      const { data: order, error: orderError } = await supabase
        .rpc('create_pos_order', {
          p_cashier_id: user.id,
          p_payment_method: paymentMethod,
          p_total_amount: totalAmount,
          p_order_items: orderItems // Remove JSON.stringify - send as array directly
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