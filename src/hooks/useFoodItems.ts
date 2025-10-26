
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
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isFetching) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    // Prevent multiple simultaneous calls
    if (isFetching) {
      console.log('🍽️ useFoodItems: Already fetching, skipping duplicate call');
      return;
    }

    console.log('🍽️ useFoodItems: Starting data fetch...', {
      timestamp: new Date().toISOString(),
      currentLoading: isLoading
    });
    
    setIsFetching(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Food items fetch timeout - setting loading to false', {
        timestamp: new Date().toISOString(),
        duration: '20s'
      });
      setIsLoading(false);
      setIsFetching(false);
    }, 20000); // 20 second timeout (increased from 15s)

    // Add a race condition with a shorter timeout for individual queries
    const queryTimeout = 10000; // 10 seconds per query

    try {
      setIsLoading(true);

      // Test Supabase connection first with timeout
      console.log('🍽️ useFoodItems: Testing Supabase connection...');
      const connectionTestPromise = supabase
        .from('food_items')
        .select('count')
        .limit(1);
      
      const connectionTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), 5000)
      );
      
      const { data: testData, error: testError } = await Promise.race([
        connectionTestPromise,
        connectionTimeoutPromise
      ]) as any;
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError);
        throw new Error(`Supabase connection failed: ${testError.message}`);
      }
      console.log('✅ Supabase connection test passed');

      // Fetch categories with timeout
      console.log('🍽️ useFoodItems: Fetching categories...');
      const categoriesStartTime = Date.now();
      
      const categoriesPromise = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      const categoriesTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Categories query timeout')), queryTimeout)
      );
      
      const { data: categoriesData, error: categoriesError } = await Promise.race([
        categoriesPromise,
        categoriesTimeoutPromise
      ]) as any;
      
      const categoriesEndTime = Date.now();
      console.log(`🍽️ Categories query took: ${categoriesEndTime - categoriesStartTime}ms`);

      if (categoriesError) {
        console.error('❌ Error fetching categories:', categoriesError);
        setCategories([]);
      } else {
        console.log('✅ Categories fetched:', categoriesData?.length || 0, 'categories');
        setCategories(categoriesData || []);
      }

      // Fetch food items with their categories and timeout
      console.log('🍽️ useFoodItems: Fetching food items...');
      const foodItemsStartTime = Date.now();
      
      const foodItemsPromise = supabase
        .from('food_items')
        .select(`
          *,
          category:categories(name, is_active)
        `)
        .eq('is_available', true)
        .order('name');
      
      const foodItemsTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Food items query timeout')), queryTimeout)
      );
      
      const { data: foodItemsData, error: foodItemsError } = await Promise.race([
        foodItemsPromise,
        foodItemsTimeoutPromise
      ]) as any;
      
      const foodItemsEndTime = Date.now();
      console.log(`🍽️ Food items query took: ${foodItemsEndTime - foodItemsStartTime}ms`);

      if (foodItemsError) {
        console.error('❌ Error fetching food items:', foodItemsError);
        setFoodItems([]);
      } else {
        console.log('✅ Food items fetched:', foodItemsData?.length || 0, 'items');
        console.log('🍽️ Sample food item:', foodItemsData?.[0]);
        setFoodItems(foodItemsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      // Ensure loading state is cleared even on error
      setCategories([]);
      setFoodItems([]);
    } finally {
      // Always clear loading state and timeout
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsFetching(false);
      console.log('🍽️ useFoodItems: Data fetch completed');
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
