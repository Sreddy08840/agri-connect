import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl?: string;
  farmerId: string;
  farmerName: string;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  addItem: async (item) => {
    const items = get().items;
    const existingItem = items.find(i => i.productId === item.productId);
    
    let newItems: CartItem[];
    if (existingItem) {
      newItems = items.map(i =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      newItems = [...items, { ...item, id: Date.now().toString() }];
    }
    
    set({ items: newItems });
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
  },

  removeItem: async (id) => {
    const newItems = get().items.filter(item => item.id !== id);
    set({ items: newItems });
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
  },

  updateQuantity: async (id, quantity) => {
    if (quantity <= 0) {
      await get().removeItem(id);
      return;
    }
    
    const newItems = get().items.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    set({ items: newItems });
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
  },

  clearCart: async () => {
    set({ items: [] });
    await AsyncStorage.removeItem('cart');
  },

  loadCart: async () => {
    try {
      set({ isLoading: true });
      const cartJson = await AsyncStorage.getItem('cart');
      if (cartJson) {
        const items = JSON.parse(cartJson);
        set({ items, isLoading: false });
      } else {
        set({ items: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      set({ items: [], isLoading: false });
    }
  },

  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
