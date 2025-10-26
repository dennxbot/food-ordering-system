import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface ItemSale {
  item_name: string;
  size: string;
  quantity: number;
  revenue: number;
}

interface SalesReport {
  date: string;
  total_sales: number;
  cash_sales: number;
  card_sales: number;
  total_orders: number;
  total_items: number;
  items_sold: ItemSale[];
}

export const usePOSReports = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSalesReport = useCallback(async (startDate: Date, endDate: Date): Promise<SalesReport[]> => {
    console.log('📊 POS Reports: Starting sales report fetch...', {
      timestamp: new Date().toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('POS Reports fetch timeout - setting loading to false', {
        timestamp: new Date().toISOString(),
        duration: '20s'
      });
      setIsLoading(false);
    }, 20000); // 20 second timeout

    if (!user) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }

    if (user.role !== 'admin') {
      setError('Only admins can view sales reports');
      throw new Error('Only admins can view sales reports');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Skip connection test for better performance

      // Set user context for RLS
      await supabase.rpc('set_user_context', { 
        user_id: user.id, 
        user_role: user.role 
      });

      // Add a small delay to prevent too frequent requests
      await new Promise(resolve => setTimeout(resolve, 300));

      const { data, error: reportError } = await supabase
        .rpc('get_pos_sales_report', {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        });

      if (reportError) {
        console.error('Error fetching POS sales report:', reportError);
        setError(reportError.message);
        throw reportError;
      }

      // Transform dates to strings and ensure numbers are numbers
      return (data || []).map(row => ({
        ...row,
        date: new Date(row.date).toISOString().split('T')[0],
        total_sales: Number(row.total_sales),
        cash_sales: Number(row.cash_sales),
        card_sales: Number(row.card_sales),
        total_orders: Number(row.total_orders),
        total_items: Number(row.total_items),
        items_sold: Array.isArray(row.items_sold) ? row.items_sold : []
      }));
    } catch (err: any) {
      console.error('Error fetching POS sales report:', err);
      setError(err.message);
      throw err;
    } finally {
      // Always clear loading state and timeout
      clearTimeout(timeoutId);
      setIsLoading(false);
      console.log('📊 POS Reports: Data fetch completed');
    }
  }, [user]);

  return {
    isLoading,
    error,
    getSalesReport
  };
};