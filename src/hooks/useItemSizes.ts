import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ItemSize {
  id: string;
  food_item_id: string;
  name: string;
  description: string | null;
  price: number;
  is_default: boolean;
  created_at: string;
}

export const useItemSizes = (foodItemId?: string) => {
  const [sizes, setSizes] = useState<ItemSize[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (foodItemId) {
      fetchSizes(foodItemId);
    }
  }, [foodItemId]);

  const fetchSizes = async (itemId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('item_sizes')
        .select('*')
        .eq('food_item_id', itemId)
        .order('price');

      if (error) throw error;
      setSizes(data || []);
    } catch (error) {
      console.error('Error fetching item sizes:', error);
      setSizes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addSize = async (size: Omit<ItemSize, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('item_sizes')
        .insert([size])
        .select()
        .single();

      if (error) throw error;
      setSizes([...sizes, data]);
      return data;
    } catch (error) {
      console.error('Error adding size:', error);
      throw error;
    }
  };

  const updateSize = async (id: string, updates: Partial<ItemSize>) => {
    try {
      const { data, error } = await supabase
        .from('item_sizes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSizes(sizes.map(size => size.id === id ? data : size));
      return data;
    } catch (error) {
      console.error('Error updating size:', error);
      throw error;
    }
  };

  const deleteSize = async (id: string) => {
    try {
      const { error } = await supabase
        .from('item_sizes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSizes(sizes.filter(size => size.id !== id));
    } catch (error) {
      console.error('Error deleting size:', error);
      throw error;
    }
  };

  const getDefaultSize = () => {
    return sizes.find(size => size.is_default) || sizes[0];
  };

  return {
    sizes,
    isLoading,
    addSize,
    updateSize,
    deleteSize,
    getDefaultSize,
    refetch: (itemId: string) => fetchSizes(itemId)
  };
};
