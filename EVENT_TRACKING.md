# Event Tracking Implementation

## Overview
Client-side event instrumentation has been added to track user interactions across web and mobile platforms.

## Events Tracked

### 1. Product View (`view`)
- **Triggered**: When a user opens a product detail page
- **Payload**:
  ```json
  {
    "type": "view",
    "userId": "user-id-or-null",
    "productId": "product-id"
  }
  ```

### 2. Add to Cart (`add_to_cart`)
- **Triggered**: When a user adds a product to their cart
- **Payload**:
  ```json
  {
    "type": "add_to_cart",
    "userId": "user-id-or-null",
    "productId": "product-id",
    "value": 150.50,
    "meta": {
      "quantity": 2,
      "unit": "kg"
    }
  }
  ```

### 3. Purchase (`purchase`)
- **Triggered**: When a user completes a purchase (ready to implement)
- **Payload**:
  ```json
  {
    "type": "purchase",
    "userId": "user-id-or-null",
    "value": 500.00,
    "meta": {
      "orderId": "order-id",
      "items": []
    }
  }
  ```

## Implementation Details

### Web (React)
- **Location**: `apps/web/src/utils/events.ts`
- **Usage**: Integrated in `ProductDetailPage.tsx`
- **Features**:
  - Automatic event tracking on page view (useEffect)
  - Event tracking on add-to-cart button click
  - Silent failure to avoid disrupting UX

### Mobile (React Native / Expo)
- **Location**: `apps/mobile/src/lib/events.ts`
- **Usage**: Integrated in `ProductDetailScreen.tsx`
- **Features**:
  - Automatic event tracking on product load
  - Event tracking on add-to-cart button press
  - **Offline queue**: Events are queued if API fails
  - **Auto-flush**: Queued events are sent when connection is restored
  - Queue size limit: 50 events max

## Testing

### 1. Start the API Server
```bash
cd packages/api
npm run dev
```

### 2. Test Web Events

#### Start Web App
```bash
cd apps/web
npm run dev
```

#### Test Steps:
1. **View Event**: Navigate to any product detail page (e.g., `/products/123`)
2. **Add to Cart Event**: Click "Add to Cart" button
3. **Verify**: Check API server logs or database

### 3. Test Mobile Events

#### Start Mobile App
```bash
cd apps/mobile
npm start
```

#### Test Steps:
1. **View Event**: Open any product from the products list
2. **Add to Cart Event**: Enter quantity and tap "Add to Cart"
3. **Verify**: Check API server logs or database

### 4. Verify Events in Database

#### Using Prisma Studio
```bash
cd packages/api
npx prisma studio
```
- Open the `Event` table
- Check for new rows with:
  - `type`: 'view' or 'add_to_cart'
  - `userId`: User ID (if logged in) or null
  - `productId`: Product ID
  - `value`: Price * quantity (for add_to_cart)
  - `meta`: Additional metadata

#### Using SQL Query
```sql
SELECT * FROM "Event" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### 5. Test Offline Queue (Mobile Only)

1. Turn off WiFi/mobile data on your device
2. View products and add items to cart
3. Events will be queued locally
4. Turn WiFi/mobile data back on
5. Events will automatically flush to the API
6. Check console logs for "Flushed X queued events"

## API Endpoint

Events are sent to: `POST /api/events`

Expected response: `201 Created`

## Error Handling

- **Web**: Errors are logged to console but don't block user actions
- **Mobile**: Failed events are queued and retried automatically
- Both platforms use `console.warn()` for non-critical errors

## Future Enhancements

1. **Purchase Tracking**: Add to checkout/order completion flow
2. **Search Tracking**: Track product searches
3. **Click Tracking**: Track button clicks and navigation
4. **Session Tracking**: Group events by user session
5. **Analytics Dashboard**: Visualize event data
6. **A/B Testing**: Use events for experiment tracking

## Troubleshooting

### Events Not Appearing in Database

1. **Check API Server**: Ensure it's running and accessible
2. **Check Network**: Verify web/mobile app can reach API
3. **Check Auth**: Events work for both logged-in and anonymous users
4. **Check Logs**: Look for errors in browser console or React Native logs
5. **Check Database**: Verify Event table exists and is accessible

### Mobile Queue Not Flushing

1. **Check AsyncStorage**: Ensure permissions are granted
2. **Check Network**: Verify device has internet connection
3. **Check Logs**: Look for "Flushed X queued events" message
4. **Manual Flush**: Call `flushEventQueue()` manually if needed

## Code Examples

### Track Custom Event (Web)
```typescript
import { trackEvent } from '../utils/events';

trackEvent({
  type: 'search',
  userId: user?.id,
  meta: { query: 'tomatoes', results: 15 }
});
```

### Track Custom Event (Mobile)
```typescript
import { trackEvent } from '../../lib/events';

trackEvent({
  type: 'click',
  userId: user?.id,
  meta: { button: 'chat_with_farmer', productId: '123' }
});
```
