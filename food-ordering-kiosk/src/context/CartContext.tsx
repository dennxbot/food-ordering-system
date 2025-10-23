import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, FoodItem, ItemSize } from '../types';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { foodItem: FoodItem; size?: ItemSize; quantity?: number; notes?: string } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_NOTES'; payload: { id: string; notes: string } }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  state: CartState;
  addItem: (foodItem: FoodItem, size?: ItemSize, quantity?: number, notes?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const calculateItemPrice = (foodItem: FoodItem, size?: ItemSize): number => {
  const basePrice = foodItem.price;
  const sizePrice = size?.price_modifier || 0;
  return basePrice + sizePrice;
};

const generateCartItemId = (foodItem: FoodItem, size?: ItemSize): string => {
  return `${foodItem.id}-${size?.id || 'default'}`;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { foodItem, size, quantity = 1, notes = '' } = action.payload;
      const itemId = generateCartItemId(foodItem, size);
      const unitPrice = calculateItemPrice(foodItem, size);
      
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);
      
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            return {
              ...item,
              quantity: newQuantity,
              total_price: unitPrice * newQuantity,
              notes: notes || item.notes,
            };
          }
          return item;
        });
      } else {
        // Add new item
        const newItem: CartItem = {
          id: itemId,
          food_item: foodItem,
          size,
          quantity,
          notes,
          total_price: unitPrice * quantity,
        };
        newItems = [...state.items, newItem];
      }
      
      const total = newItems.reduce((sum, item) => sum + item.total_price, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: newItems,
        total,
        itemCount,
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.id);
      const total = newItems.reduce((sum, item) => sum + item.total_price, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: newItems,
        total,
        itemCount,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { id } });
      }
      
      const newItems = state.items.map(item => {
        if (item.id === id) {
          const unitPrice = calculateItemPrice(item.food_item, item.size);
          return {
            ...item,
            quantity,
            total_price: unitPrice * quantity,
          };
        }
        return item;
      });
      
      const total = newItems.reduce((sum, item) => sum + item.total_price, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: newItems,
        total,
        itemCount,
      };
    }
    
    case 'UPDATE_NOTES': {
      const { id, notes } = action.payload;
      const newItems = state.items.map(item => {
        if (item.id === id) {
          return { ...item, notes };
        }
        return item;
      });
      
      return {
        ...state,
        items: newItems,
      };
    }
    
    case 'CLEAR_CART': {
      return {
        items: [],
        total: 0,
        itemCount: 0,
      };
    }
    
    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  const addItem = (foodItem: FoodItem, size?: ItemSize, quantity = 1, notes = '') => {
    dispatch({ type: 'ADD_ITEM', payload: { foodItem, size, quantity, notes } });
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const updateNotes = (id: string, notes: string) => {
    dispatch({ type: 'UPDATE_NOTES', payload: { id, notes } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};