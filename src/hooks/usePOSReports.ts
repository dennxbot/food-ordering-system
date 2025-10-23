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
      setIsLoading(false);
    }
  }, [user]);

  return {
    isLoading,
    error,
    getSalesReport
  };
};