import { useCartStore } from '../../stores/cartStore';

export default function CartDebugger() {
  const { items, getTotalItems, getTotalPrice } = useCartStore();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Cart Debug Info</h3>
      <p>Items count: {getTotalItems()}</p>
      <p>Total price: ₹{getTotalPrice().toFixed(2)}</p>
      <p>Items array length: {items?.length || 0}</p>
      <details className="mt-2">
        <summary className="cursor-pointer">Items Details</summary>
        <pre className="mt-1 text-xs overflow-auto max-h-32">
          {JSON.stringify(items, null, 2)}
        </pre>
      </details>
    </div>
  );
}
