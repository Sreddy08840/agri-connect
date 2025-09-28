# 🛒 Complete Order Flow Testing Guide - Agri-Connect

## 🔧 **Debugging Cart Issues**

If you're seeing "Cart is empty" errors but items are showing:

### Step 1: Check Browser Storage
1. Open Developer Tools (F12)
2. Go to Application/Storage tab
3. Check Local Storage for `cart-storage` key
4. Verify the cart data is properly stored

### Step 2: Clear Browser Cache
1. Clear browser cache and cookies
2. Refresh the page
3. Try adding products again

### Step 3: Check Console Errors
1. Open Console tab in Developer Tools
2. Look for any JavaScript errors
3. Check for API call failures

## 📋 **Complete Order Flow Steps**

### **Phase 1: Add Products to Cart**
1. **Navigate to Products Page**
   - Go to `/products` or click "Browse Products"
   - Products should load from the API

2. **Add Items to Cart**
   - Click "Add to Cart" on any product
   - Should see success toast notification
   - Cart badge in header should update with item count

3. **Verify Cart Contents**
   - Click cart icon in header or go to `/cart`
   - Should see added products with quantities
   - Total price should be calculated correctly

### **Phase 2: Proceed to Checkout**
1. **Access Checkout Page**
   - From cart page, click "Proceed to Checkout"
   - Or navigate directly to `/checkout`

2. **Fill Delivery Address**
   - Street and house number (required)
   - City (required)
   - State (required)
   - Pincode (required)
   - Landmark (optional)

3. **Review Order Summary**
   - Verify all cart items are listed
   - Check farmer groupings
   - Confirm total amount

### **Phase 3: Place Order**
1. **Choose Payment Method**
   - Currently only COD (Cash on Delivery) is available
   - Online payment is marked as "Coming Soon"

2. **Place COD Order**
   - Click "Place COD Order" button
   - Order will be created via API call to `/orders`
   - Cart will be cleared automatically

3. **Order Confirmation**
   - Redirected to `/order-confirmation/{orderId}`
   - Shows order success message
   - Displays order ID

### **Phase 4: Track Order**
1. **View Order Details**
   - Click "View Order Details" from confirmation page
   - Or go to `/orders/{orderId}`
   - Shows order status, items, and farmer info

2. **Check Order Status**
   - **PLACED**: Order just created
   - **CONFIRMED**: Farmer accepted the order
   - **PACKED**: Order is being prepared
   - **SHIPPED**: Order is in transit
   - **DELIVERED**: Order completed

3. **Rate Farmer** (After Delivery)
   - "Rate Farmer" button appears when status is DELIVERED
   - Provide rating and feedback

## 🔄 **Admin Order Management Flow**

### **For Farmers:**
1. **Login as Farmer**
   - Use `/farmer-login` page
   - Access farmer dashboard at `/farmer/dashboard`

2. **Manage Orders**
   - Go to `/farmer/orders`
   - View incoming orders
   - Update order status (Accept → Pack → Ship → Deliver)

### **For Admins:**
1. **Login as Admin**
   - Use `/admin-login` page
   - Access admin dashboard at `/admin`

2. **Monitor Orders**
   - View all orders at `/admin/orders`
   - Monitor order flow and resolve issues

## 🐛 **Common Issues & Solutions**

### **Cart Not Persisting**
```javascript
// Check if cart store is working
console.log(useCartStore.getState());
```

### **API Errors**
- Check if backend server is running on port 8080
- Verify API endpoints are accessible
- Check authentication tokens

### **Order Creation Fails**
- Ensure user is logged in
- Verify cart has valid items
- Check address fields are filled
- Confirm API `/orders` endpoint is working

### **Status Updates Not Showing**
- Check Socket.IO connection
- Verify real-time updates are enabled
- Refresh page to get latest status

## 📱 **Testing Checklist**

- [ ] Add products to cart
- [ ] View cart with correct items and totals
- [ ] Proceed to checkout without errors
- [ ] Fill delivery address completely
- [ ] Place COD order successfully
- [ ] Receive order confirmation
- [ ] View order details page
- [ ] Check order status updates
- [ ] Test farmer order management (if farmer account)
- [ ] Test admin monitoring (if admin account)

## 🔧 **Quick Fixes**

### **If Cart Shows Empty:**
1. Clear browser storage: `localStorage.clear()`
2. Refresh page and try again
3. Check network tab for API errors

### **If Checkout Fails:**
1. Ensure all address fields are filled
2. Check console for validation errors
3. Verify user authentication

### **If Order Not Created:**
1. Check backend logs
2. Verify database connection
3. Test API endpoint directly

## 🚀 **Next Steps After Testing**

1. **Payment Integration**: Add Razorpay/Stripe for online payments
2. **SMS Notifications**: Send order updates via SMS
3. **Email Confirmations**: Send order receipts
4. **Inventory Management**: Real-time stock updates
5. **Delivery Tracking**: GPS-based tracking
6. **Review System**: Customer feedback and ratings

---

**Need Help?** Check the browser console for errors and verify all API endpoints are working correctly.
