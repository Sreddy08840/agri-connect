// Simple cart debugging utility
export const debugCart = () => {
  const cartData = localStorage.getItem('cart-storage');
  
  console.group('🛒 Cart Debug Info');
  console.log('Local storage cart:', cartData);
  
  if (cartData) {
    try {
      const parsed = JSON.parse(cartData);
      console.log('Parsed cart state:', parsed);
      console.log('Items count:', parsed.state?.items?.length || 0);
    } catch (e) {
      console.error('Failed to parse cart data:', e);
    }
  }
  
  console.groupEnd();
};

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugCart = debugCart;
}
