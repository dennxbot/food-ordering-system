import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Connection monitoring and auto-reconnection
let connectionCheckInterval: NodeJS.Timeout | null = null;
let isConnected = true;
let lastConnectionAttempt = 0;
let connectionFailureCount = 0;

export const startConnectionMonitoring = () => {
  if (connectionCheckInterval) return;
  
  connectionCheckInterval = setInterval(async () => {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        connectionFailureCount++;
        console.warn('🔌 Supabase connection lost, attempting reconnection...', {
          failureCount: connectionFailureCount,
          error: error.message
        });
        isConnected = false;
        
        // Only attempt reconnection if we haven't tried recently and failure count is reasonable
        const now = Date.now();
        const timeSinceLastAttempt = now - lastConnectionAttempt;
        
        if (timeSinceLastAttempt > 60000 && connectionFailureCount < 5) { // 1 minute cooldown, max 5 attempts
          lastConnectionAttempt = now;
          try {
            await supabase.auth.refreshSession();
          } catch (refreshError) {
            console.warn('🔌 Token refresh failed:', refreshError);
          }
        } else if (connectionFailureCount >= 5) {
          console.warn('🔌 Too many connection failures, stopping reconnection attempts');
          stopConnectionMonitoring();
        }
      } else if (!isConnected) {
        console.log('✅ Supabase connection restored');
        isConnected = true;
        connectionFailureCount = 0; // Reset failure count on successful connection
      }
    } catch (error) {
      connectionFailureCount++;
      console.warn('🔌 Connection check failed:', error);
      isConnected = false;
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('🌐 Network appears to be disconnected, pausing connection monitoring');
        stopConnectionMonitoring();
        
        // Restart monitoring after a longer delay when network might be back
        setTimeout(() => {
          console.log('🔄 Restarting connection monitoring...');
          startConnectionMonitoring();
        }, 120000); // 2 minutes
      }
    }
  }, 30000); // Check every 30 seconds
};

export const stopConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

export const resetConnectionMonitoring = () => {
  console.log('🔄 Resetting connection monitoring...');
  stopConnectionMonitoring();
  connectionFailureCount = 0;
  lastConnectionAttempt = 0;
  isConnected = true;
  startConnectionMonitoring();
};

// Start monitoring on module load
if (typeof window !== 'undefined') {
  startConnectionMonitoring();
}

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