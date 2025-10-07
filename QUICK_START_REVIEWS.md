# Quick Start: Product Review System

## Step 1: Apply Database Migration

Run these commands in order:

```bash
# Navigate to API package
cd packages/api

# Run migration to add review tables
npx prisma migrate dev --name add_product_reviews

# Generate Prisma client with new types
npx prisma generate
```

## Step 2: Restart the API Server

```bash
# Stop the current API server (Ctrl+C)
# Then restart it
npm run dev
```

Or if using the start script from root:
```bash
# From project root
./start-dev.bat
```

## Step 3: Test the Review System

### Option A: Using Existing Data
1. Open the web app: `http://localhost:5173`
2. Login as a customer
3. Go to "My Orders"
4. Find a delivered order (or update an order status to DELIVERED in Prisma Studio)
5. Click the "Review" button
6. Submit a review with rating and comment

### Option B: Create Test Data
```bash
# Open Prisma Studio to manually update order status
cd packages/api
npx prisma studio

# In Prisma Studio:
# 1. Go to "Order" table
# 2. Find an order
# 3. Change status to "DELIVERED"
# 4. Save
```

## Step 4: Verify the Implementation

### Check Product Cards
- Navigate to Products page
- You should see star ratings on product cards
- Rating count should appear next to stars

### Check Product Detail Page
- Click on a product
- See rating summary at top
- Scroll down to see "Customer Reviews" section
- If eligible, you'll see "Write a Review" button

### Check Orders Page
- Go to "My Orders"
- Delivered orders show "Review" button
- Hover over product items to see star icon
- Click to open review modal

## Troubleshooting

### Migration Issues
If migration fails:
```bash
cd packages/api
npx prisma db push
npx prisma generate
```

### API Not Loading Reviews
- Check API console for errors
- Verify `/api/reviews` route is registered
- Test endpoint: `http://localhost:8080/api/reviews/products/{productId}`

### Reviews Not Showing
- Ensure product has `ratingAvg` and `ratingCount` fields
- Check browser console for errors
- Verify API is returning data

## Quick Test Commands

```bash
# Test review endpoint (replace with actual productId)
curl http://localhost:8080/api/reviews/products/YOUR_PRODUCT_ID

# Check if user can review (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/reviews/products/YOUR_PRODUCT_ID/can-review
```

## What's Working Now

✅ Database schema with ProductReview table
✅ Product.ratingAvg and Product.ratingCount fields
✅ Full REST API for reviews
✅ Star rating component (interactive & display)
✅ Review submission form with validation
✅ Review list display
✅ Product cards show ratings
✅ Product detail page with reviews section
✅ Orders page with review buttons
✅ Automatic rating calculation
✅ Purchase verification (only delivered orders)
✅ One review per user per product

## Next Steps (Optional Enhancements)

- Add review image uploads
- Implement helpful/unhelpful voting
- Add review filtering and sorting
- Create farmer response system
- Add review moderation for admins
