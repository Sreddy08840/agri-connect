# Event Tracking Implementation Summary

## ✅ Completed Implementation

Client-side event instrumentation has been successfully added to track user interactions across both web and mobile platforms.

## 📊 Events Tracked

### 1. **Product View** (`view`)
- **Web**: `apps/web/src/pages/ProductDetailPage.tsx` (line 25-29)
- **Mobile**: `apps/mobile/src/screens/customer/ProductDetailScreen.tsx` (line 37-38)
- **Trigger**: Automatically when product page loads
- **Data**: `type`, `userId`, `productId`

### 2. **Add to Cart** (`add_to_cart`)
- **Web**: `apps/web/src/pages/ProductDetailPage.tsx` (line 38-45)
- **Mobile**: `apps/mobile/src/screens/customer/ProductDetailScreen.tsx` (line 67-72)
- **Trigger**: When user clicks/taps "Add to Cart" button
- **Data**: `type`, `userId`, `productId`, `value` (price × quantity), `meta` (quantity, unit)

### 3. **Purchase** (`purchase`)
- **Web**: `apps/web/src/pages/CheckoutPage.tsx` (line 79-93)
- **Mobile**: `apps/mobile/src/screens/customer/CheckoutScreen.tsx` (line 72-86)
- **Trigger**: When order is successfully placed
- **Data**: `type`, `userId`, `value` (total), `meta` (orderId, itemCount, paymentMethod, items array)

## 📁 Files Created

### Web
- **`apps/web/src/utils/events.ts`** - Event tracking utility with helper functions
  - `trackEvent()` - Core tracking function
  - `trackProductView()` - Helper for product views
  - `trackAddToCart()` - Helper for cart additions
  - `trackPurchase()` - Helper for purchases

### Mobile
- **`apps/mobile/src/lib/events.ts`** - Event tracking utility with offline queue support
  - `trackEvent()` - Core tracking function with queue fallback
  - `queueEvent()` - Queue events when offline
  - `flushEventQueue()` - Flush queued events when online
  - `trackProductView()` - Helper for product views
  - `trackAddToCart()` - Helper for cart additions
  - `trackPurchase()` - Helper for purchases

## 📁 Files Modified

### Web
1. **`apps/web/src/pages/ProductDetailPage.tsx`**
   - Added imports for `trackProductView`, `trackAddToCart`, `useAuthStore`, `useEffect`
   - Added `useEffect` hook to track product views
   - Added tracking call in `addToCartMutation.onSuccess`

2. **`apps/web/src/pages/CheckoutPage.tsx`**
   - Added import for `trackPurchase`
   - Added tracking call in `createOrder.onSuccess`

### Mobile
1. **`apps/mobile/src/screens/customer/ProductDetailScreen.tsx`**
   - Added imports for `trackProductView`, `trackAddToCart`, `useAuthStore`
   - Added tracking call in `fetchProduct` after successful load
   - Added tracking call in `handleAddToCart` after adding to cart

2. **`apps/mobile/src/screens/customer/CheckoutScreen.tsx`**
   - Added import for `trackPurchase`
   - Added tracking call in `handlePlaceOrder` after successful order creation

## 🎯 Key Features

### Web Implementation
- ✅ Silent failure - errors don't disrupt user experience
- ✅ Automatic view tracking via `useEffect`
- ✅ Tracks both authenticated and anonymous users
- ✅ Includes product value and metadata

### Mobile Implementation
- ✅ **Offline queue** - Events are stored locally if API fails
- ✅ **Auto-flush** - Queued events sent when connection restored
- ✅ **Queue limit** - Max 50 events to prevent storage bloat
- ✅ Silent failure with console warnings
- ✅ Tracks both authenticated and anonymous users

## 🧪 Testing Instructions

### Quick Test
```bash
# Terminal 1: Start API
cd packages/api
npm run dev

# Terminal 2: Start Web
cd apps/web
npm run dev

# Terminal 3: Start Mobile
cd apps/mobile
npm start
```

### Verify Events
1. **Browser/App**: Navigate to product page → Add to cart → Checkout
2. **API Logs**: Watch for POST /api/events requests
3. **Database**: Check Event table in Prisma Studio
   ```bash
   cd packages/api
   npx prisma studio
   ```

### Test Offline Queue (Mobile)
1. Disable device internet
2. View products and add to cart
3. Re-enable internet
4. Check console for "Flushed X queued events"

## 📋 Event Payload Examples

### View Event
```json
{
  "type": "view",
  "userId": "cm5abc123",
  "productId": "cm5xyz789"
}
```

### Add to Cart Event
```json
{
  "type": "add_to_cart",
  "userId": "cm5abc123",
  "productId": "cm5xyz789",
  "value": 150.50,
  "meta": {
    "quantity": 2,
    "unit": "kg"
  }
}
```

### Purchase Event
```json
{
  "type": "purchase",
  "userId": "cm5abc123",
  "value": 450.75,
  "meta": {
    "orderId": "cm5order123",
    "itemCount": 3,
    "paymentMethod": "COD",
    "items": [
      {
        "productId": "cm5xyz789",
        "name": "Tomatoes",
        "quantity": 2,
        "price": 75.25
      }
    ]
  }
}
```

## 🔍 Troubleshooting

### Events not appearing?
- ✅ Check API server is running
- ✅ Verify `/api/events` endpoint exists
- ✅ Check browser/app console for errors
- ✅ Verify Event table exists in database

### Mobile queue not working?
- ✅ Check AsyncStorage permissions
- ✅ Look for console warnings
- ✅ Manually call `flushEventQueue()`

## 📚 Documentation
See `EVENT_TRACKING.md` for detailed documentation including:
- API endpoint details
- Error handling strategies
- Future enhancement ideas
- Code examples for custom events

## 🎉 Summary
All requested event tracking has been implemented:
- ✅ Product view tracking
- ✅ Add-to-cart tracking
- ✅ Purchase tracking
- ✅ Web (React) implementation
- ✅ Mobile (React Native) implementation
- ✅ Offline queue support (mobile)
- ✅ Silent error handling
- ✅ Comprehensive documentation
