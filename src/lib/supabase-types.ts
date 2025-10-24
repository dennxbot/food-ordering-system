// Additional Supabase types for POS orders
export interface POSOrder {
  id: string;
  cashier_id: string;
  order_number: string;
  total_amount: number;
  payment_method: 'cash' | 'card';
  status: 'completed' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface POSOrderItem {
  id: string;
  pos_order_id: string;
  food_item_id: string;
  size_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

// Order source types
export type OrderSource = 'online' | 'kiosk' | 'pos';

// Enhanced order type with source
export interface OrderWithSource {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: string | null;
  order_type: 'delivery' | 'pickup' | 'pos';
  payment_method: 'cash' | 'card' | 'online';
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';
  total_amount: number;
  order_source: OrderSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Kiosk Orders Types
export interface KioskOrder {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address?: string;
  order_type: 'pickup' | 'delivery';
  payment_method: 'cash' | 'card';
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  notes?: string;
  kiosk_id?: string;
  order_number: string;
  created_at: string;
  updated_at: string;
}

export interface KioskOrderItem {
  id: string;
  kiosk_order_id: string;
  food_item_id: string;
  size_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface KioskOrderWithItems extends KioskOrder {
  kiosk_order_items: (KioskOrderItem & {
    food_items: {
      id: string;
      name: string;
      image_url?: string;
    };
    item_sizes?: {
      id: string;
      name: string;
    };
  })[];
}