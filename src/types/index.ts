export interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  has_sizes: boolean;
  preparation_time: number;
  category?: {
    name: string;
  };
}

export interface ItemSize {
  id: string;
  food_item_id: string;
  name: string;
  description: string | null;
  price: number;
  is_default: boolean;
  created_at: string;
}

export interface CartItem extends FoodItem {
  quantity: number;
  size_id: string | null;
  size_name: string | null;
  size_price: number | null;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  order_type: 'delivery' | 'pickup';
  payment_method: 'cash' | 'card';
  status: 'pending' | 'preparing' | 'out-for-delivery' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_item_id: string;
  size_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}