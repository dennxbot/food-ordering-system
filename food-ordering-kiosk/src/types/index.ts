// Types for the Food Ordering Kiosk Application

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemSize {
  id: string;
  food_item_id: string;
  size_name: string;
  price_modifier: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  food_item: FoodItem;
  size?: ItemSize;
  quantity: number;
  notes?: string;
  total_price: number;
}

export interface Order {
  id: string;
  user_id?: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_item_id: string;
  size_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  food_item: FoodItem;
  size?: ItemSize;
}

export interface KioskConfig {
  kioskId: string;
  locationName: string;
  printerEnabled: boolean;
  autoRefreshInterval: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PrintReceipt {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: string;
  kioskLocation: string;
}