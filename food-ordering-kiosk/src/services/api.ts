import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { FoodItem, Order, OrderItem, ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://food-ordering-system-wlaz.onrender.com';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Food Items API
  async getFoodItems(): Promise<FoodItem[]> {
    try {
      const response: AxiosResponse<FoodItem[]> = await this.api.get('/api/food-items');
      return response.data;
    } catch (error) {
      console.error('Error fetching food items:', error);
      throw new Error('Failed to fetch menu items');
    }
  }

  async getFoodItemById(id: string): Promise<FoodItem> {
    try {
      const response: AxiosResponse<FoodItem> = await this.api.get(`/api/food-items/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food item:', error);
      throw new Error('Failed to fetch food item details');
    }
  }

  // Orders API
  async createOrder(orderData: {
    order_items: Array<{
      food_item_id: string;
      size_id?: string;
      quantity: number;
      unit_price: number;
      notes?: string;
    }>;
    total_amount: number;
    order_type: 'dine_in' | 'takeaway' | 'delivery';
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
  }): Promise<Order> {
    try {
      const response: AxiosResponse<Order> = await this.api.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  async getOrderById(id: string): Promise<Order> {
    try {
      const response: AxiosResponse<Order> = await this.api.get(`/api/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
    try {
      const response: AxiosResponse<Order> = await this.api.patch(`/api/orders/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get categories
  async getCategories(): Promise<string[]> {
    try {
      const foodItems = await this.getFoodItems();
      const categories = [...new Set(foodItems.map(item => item.category))];
      return categories.filter(Boolean);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }
}

export const apiService = new ApiService();
export default ApiService;