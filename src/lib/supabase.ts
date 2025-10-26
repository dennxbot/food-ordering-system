import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      item_sizes: {
        Row: {
          id: string;
          food_item_id: string;
          name: string;
          description: string | null;
          price: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          food_item_id: string;
          name: string;
          description?: string | null;
          price: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          food_item_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          is_default?: boolean;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          contact_number: string | null;
          address: string | null;
          role: 'customer' | 'admin' | 'kiosk';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          contact_number?: string | null;
          address?: string | null;
          role?: 'customer' | 'admin' | 'kiosk';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          contact_number?: string | null;
          address?: string | null;
          role?: 'customer' | 'admin' | 'kiosk';
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      food_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category_id: string | null;
          is_available: boolean;
          is_featured: boolean;
          has_sizes: boolean;
          preparation_time: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category_id?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          has_sizes?: boolean;
          preparation_time?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category_id?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          has_sizes?: boolean;
          preparation_time?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string;
          customer_address: string | null;
          order_type: 'delivery' | 'pickup' | 'pos';
          payment_method: 'cash' | 'card' | 'online';
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          total_amount: number;
          order_source: 'online' | 'kiosk' | 'pos';
          notes: string | null;
          estimated_ready_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          customer_name: string;
          customer_email?: string | null;
          customer_phone: string;
          customer_address?: string | null;
          order_type?: 'delivery' | 'pickup' | 'pos';
          payment_method?: 'cash' | 'card' | 'online';
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          total_amount: number;
          order_source?: 'online' | 'kiosk' | 'pos';
          notes?: string | null;
          estimated_ready_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string;
          customer_address?: string | null;
          order_type?: 'delivery' | 'pickup' | 'pos';
          payment_method?: 'cash' | 'card' | 'online';
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
          total_amount?: number;
          order_source?: 'online' | 'kiosk' | 'pos';
          notes?: string | null;
          estimated_ready_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          food_item_id: string;
          size_id: string | null;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          food_item_id: string;
          size_id?: string | null;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          food_item_id?: string;
          size_id?: string | null;
          quantity?: number;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          food_item_id: string | null;
          size_id: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          special_instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          food_item_id?: string | null;
          size_id?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          special_instructions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          food_item_id?: string | null;
          size_id?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          special_instructions?: string | null;
          created_at?: string;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          changed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
};