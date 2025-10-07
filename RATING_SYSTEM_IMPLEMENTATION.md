# Product Rating & Review System Implementation

## Overview
A complete star-based rating and review system has been implemented for products in the AgriConnect platform.

## Features Implemented

### 1. Database Schema
- **ProductReview Model**: New table to store product reviews
  - Rating (1-5 stars)
  - Comment (optional)
  - Images (optional, for future enhancement)
  - Links to user, product, and order
  - Unique constraint: one review per user per product

- **Product Model Updates**:
  - `ratingAvg`: Average rating (Float, default 0)
  - `ratingCount`: Total number of reviews (Int, default 0)

### 2. API Endpoints
Created `/api/reviews` routes:
- `GET /reviews/products/:productId` - Get all reviews for a product
- `GET /reviews/products/:productId/my-review` - Get current user's review
- `GET /reviews/products/:productId/can-review` - Check if user can review
- `POST /reviews/products/:productId` - Create/update a review
- `DELETE /reviews/:reviewId` - Delete a review

**Review Eligibility Rules**:
- Users must have purchased the product
- Order must be in DELIVERED status
- One review per user per product
- Users can update their existing reviews

### 3. UI Components

#### StarRating Component (`apps/web/src/components/StarRating.tsx`)
- Displays star ratings with partial star support
- Interactive mode for rating selection
- Configurable sizes: sm, md, lg
- Optional rating value display

#### ProductReviewForm Component (`apps/web/src/components/ProductReviewForm.tsx`)
- Modal form for submitting/editing reviews
- Interactive star rating selector
- Optional comment field (500 char limit)
- Validation and error handling

#### ProductReviewList Component (`apps/web/src/components/ProductReviewList.tsx`)
- Displays list of product reviews
- Shows user info, rating, comment, and date
- Pagination support
- Empty state handling

### 4. Integration Points

#### Product Cards (`apps/web/src/components/ProductCard.tsx`)
- Display average rating badge with star icon
- Show review count
- Visible on product listing pages

#### Product Detail Page (`apps/web/src/pages/ProductDetailPage.tsx`)
- Product rating summary at top
- Full reviews section at bottom
- "Write a Review" button (for eligible customers)
- "Edit Your Review" button (if already reviewed)
- Review eligibility messages

#### Orders Page (`apps/web/src/pages/OrdersPage.tsx`)
- "Review" button on delivered orders
- Star icon on individual product items (on hover)
- Opens review modal for quick access

## Database Migration

### To Apply the Schema Changes:

1. **Navigate to the API package**:
   ```bash
   cd packages/api
   ```

2. **Run the migration**:
   ```bash
   npx prisma migrate dev --name add_product_reviews
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Restart the API server** to load the new routes and schema

## Usage Flow

### For Customers:
1. **Purchase a product** → Place order and wait for delivery
2. **Order delivered** → "Review" button appears on Orders page
3. **Click Review** → Modal opens with star rating selector
4. **Select rating** (1-5 stars) and optionally add comment
5. **Submit** → Review saved and product rating updated
6. **View on product page** → Rating appears on product cards and detail page

### For All Users:
- View product ratings on product cards (listing pages)
- View detailed reviews on product detail pages
- See average rating and review count

## Automatic Rating Calculation
- When a review is created/updated/deleted, the product's `ratingAvg` and `ratingCount` are automatically recalculated
- Uses Prisma aggregate functions for accuracy
- Updates happen in the same transaction as the review operation

## Security & Validation
- Authentication required for creating/editing/deleting reviews
- Users can only review products they've purchased
- Users can only delete their own reviews (or admins)
- Rating must be between 1-5
- Comment limited to 500 characters
- Unique constraint prevents duplicate reviews

## Future Enhancements (Optional)
- [ ] Image upload support for reviews
- [ ] Helpful/unhelpful voting on reviews
- [ ] Review moderation system
- [ ] Review response from farmers
- [ ] Filter reviews by rating
- [ ] Sort reviews (most recent, highest rated, etc.)
- [ ] Review verification badge for confirmed purchases

## Files Created/Modified

### New Files:
- `packages/api/src/routes/reviews.ts` - Review API endpoints
- `apps/web/src/components/StarRating.tsx` - Star rating component
- `apps/web/src/components/ProductReviewForm.tsx` - Review form modal
- `apps/web/src/components/ProductReviewList.tsx` - Review list display

### Modified Files:
- `packages/api/prisma/schema.prisma` - Added ProductReview model and Product fields
- `packages/api/src/index.ts` - Added reviews route
- `apps/web/src/components/ProductCard.tsx` - Added rating display
- `apps/web/src/pages/ProductDetailPage.tsx` - Added reviews section
- `apps/web/src/pages/OrdersPage.tsx` - Added review buttons

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Restart API server
- [ ] Create a test order and mark it as DELIVERED
- [ ] Submit a review from the Orders page
- [ ] Verify review appears on Product Detail page
- [ ] Verify rating appears on Product Card
- [ ] Try editing an existing review
- [ ] Verify only delivered orders show review button
- [ ] Test review eligibility checks
- [ ] Verify rating calculation updates correctly

## Notes
- The system uses SQLite, so all JSON fields (like images) are stored as strings
- Reviews are soft-linked to orders (optional orderId) for verification
- The unique constraint ensures data integrity (one review per user per product)
