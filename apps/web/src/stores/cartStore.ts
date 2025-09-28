import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
  farmerId: string;
  farmerName: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemsByFarmer: () => Record<string, CartItem[]>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find(i => i.productId === item.productId);
        
        if (existingItem) {
          const updatedItems = items.map(i =>
            i.productId === item.productId
              ? { ...i, qty: i.qty + item.qty }
              : i
          );
          set({ items: updatedItems });
        } else {
          const newItem = { 
            ...item, 
            id: `cart-${Date.now()}-${Math.random()}`,
            // Ensure all required fields are present
            productId: item.productId,
            name: item.name,
            price: Number(item.price),
            unit: item.unit,
            qty: Number(item.qty),
            farmerId: item.farmerId,
            farmerName: item.farmerName,
            image: item.image
          };
          const updatedItems = [...items, newItem];
          set({ items: updatedItems });
        }
      },
      
      updateQuantity: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.productId === productId ? { ...item, qty } : item
          )
        });
      },
      
      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.productId !== productId)
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.qty), 0);
      },
      
      getItemsByFarmer: () => {
        const items = get().items;
        return items.reduce((acc, item) => {
          if (!acc[item.farmerId]) {
            acc[item.farmerId] = [];
          }
          acc[item.farmerId].push(item);
          return acc;
        }, {} as Record<string, CartItem[]>);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
