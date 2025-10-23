
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

import type { FoodItem } from '../types';

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const useFoodItems = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch ALL food items with category info (don't filter by availability here)
      const { data: foodItemsData, error: foodItemsError } = await supabase
        .from('food_items')
        .select(`
          *,
          category:categories(name)
        `)
        .order('name');

      if (foodItemsError) throw foodItemsError;
      setFoodItems(foodItemsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFoodItemsByCategory = (categoryId: string) => {
    return foodItems.filter(item => item.category_id === categoryId);
  };

  const getFeaturedItems = () => {
    return foodItems.filter(item => item.is_featured);
  };

  const searchFoodItems = (query: string) => {
    if (!query.trim()) return foodItems;
    
    const searchTerm = query.toLowerCase().trim();
    return foodItems.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchTerm);
      const descriptionMatch = item.description && item.description.toLowerCase().includes(searchTerm);
      const categoryMatch = item.category?.name && item.category.name.toLowerCase().includes(searchTerm);
      
      return nameMatch || descriptionMatch || categoryMatch;
    });
  };

  const getFoodItemById = (id: string) => {
    return foodItems.find(item => item.id === id);
  };

  return {
    foodItems,
    categories,
    isLoading,
    getFoodItemsByCategory,
    getFeaturedItems,
    searchFoodItems,
    getFoodItemById,
    refetch: fetchData,
  };
};
