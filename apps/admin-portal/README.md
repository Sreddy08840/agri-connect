# Agri-Connect Admin Portal

A separate, secure admin portal for managing the Agri-Connect platform. This portal runs independently from the main application and provides comprehensive administrative controls.

## 🚀 Features

### 🔐 Secure Admin Authentication
- Dedicated admin login with phone + password + OTP verification
- Role-based access control (ADMIN role required)
- Separate token storage from main application
- Session management with auto-refresh

### 📊 Dashboard & Analytics
- Real-time platform statistics
- User, product, and order metrics
- System status monitoring
- Quick action cards for common tasks

### 👥 User Management
- View all users (farmers, customers, admins)
- User verification controls
- Search and filter capabilities
- User role management
- Account deletion (non-admin users)

### 📦 Product Management
- Review and approve farmer products
- Product status management (Pending/Approved/Rejected)
- Detailed product information
- Bulk actions and filtering

### 🛒 Order Management
- Monitor all platform orders
- Order status tracking and updates
- Customer and farmer information
- Order details and history

### ⚙️ Settings & Configuration
- General platform settings
- Notification preferences
- Security configurations
- System settings and maintenance mode

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **API**: Axios with interceptors

## 📋 Prerequisites

- Node.js 16+ 
- Backend API server running on port 8080
- Admin user created in database

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd apps/admin-portal
npm install
```

### 2. Environment Configuration
Create `.env` file:
```env
VITE_API_URL=http://localhost:8080/api
```

### 3. Start Development Server
```bash
npm run dev
```

The admin portal will be available at: **http://localhost:3000**

## 🔑 Admin Credentials

Default admin credentials:
- **Phone**: `+919606860853`
- **Password**: `Santosh@123`
- **Login URL**: `http://localhost:3000/login`

## 📁 Project Structure

```
src/
├── components/
│   └── AdminLayout.tsx          # Main layout with sidebar
├── pages/
│   ├── LoginPage.tsx           # Admin authentication
│   ├── DashboardPage.tsx       # Main dashboard
│   ├── UsersPage.tsx           # User management
│   ├── ProductsPage.tsx        # Product management
│   ├── OrdersPage.tsx          # Order management
│   └── SettingsPage.tsx        # Admin settings
├── stores/
│   └── authStore.ts            # Authentication state
├── lib/
│   └── api.ts                  # API configuration
└── main.tsx                    # App entry point
```

## 🔒 Security Features

### Authentication
- Separate admin token storage (`adminAccessToken`)
- Role verification on every request
- Automatic token refresh
- Session timeout handling

### Access Control
- Admin role required for all routes
- Protected API endpoints
- Secure logout with token cleanup

### Data Protection
- Input validation with Zod schemas
- XSS protection
- CSRF protection via API configuration

## 🌐 API Integration

The admin portal connects to the main API server with these endpoints:

### Authentication
- `POST /auth/login-password` - Admin login
- `POST /auth/otp/verify-2fa` - OTP verification
- `GET /auth/me` - Get admin profile

### Management
- `GET /users` - List all users
- `GET /products` - List all products
- `GET /orders` - List all orders
- `PATCH /users/:id` - Update user
- `PATCH /products/:id` - Update product
- `PATCH /orders/:id` - Update order

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Environment Variables
```env
VITE_API_URL=https://your-api-domain.com/api
```

## 🔧 Configuration

### Port Configuration
Default port: `3000`

To change port, update `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3001, // Your desired port
    host: true,
  },
})
```

### API Configuration
Update API base URL in `src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

## 📊 Features Overview

### Dashboard
- **User Statistics**: Total users, farmers, customers
- **Product Metrics**: Total products, pending reviews
- **Order Analytics**: Order counts by status
- **Revenue Tracking**: Total platform revenue
- **System Status**: API, database, storage status

### User Management
- **Search & Filter**: Find users by name, phone, role
- **Verification Control**: Verify/unverify user accounts
- **Role Management**: View user roles and permissions
- **Account Actions**: Delete non-admin accounts

### Product Management
- **Review Queue**: Products pending approval
- **Status Control**: Approve/reject products
- **Product Details**: View complete product information
- **Farmer Information**: See product owner details

### Order Management
- **Order Tracking**: Monitor all platform orders
- **Status Updates**: Change order status
- **Customer Support**: Access customer and farmer details
- **Order History**: Complete order timeline

### Settings
- **General Settings**: Site configuration
- **Notifications**: Email, SMS, push notifications
- **Security**: Password policies, session management
- **System**: Backup, logging, maintenance mode

## 🔍 Monitoring & Logging

### Real-time Updates
- Dashboard refreshes every 30 seconds
- Live order status updates
- User activity monitoring

### Error Handling
- Toast notifications for user feedback
- API error handling with retry logic
- Loading states for better UX

## 🛡️ Best Practices

### Security
- Always verify admin role before API calls
- Use HTTPS in production
- Implement rate limiting
- Regular security audits

### Performance
- Lazy load components
- Implement pagination for large datasets
- Use React Query for caching
- Optimize bundle size

### Maintenance
- Regular dependency updates
- Monitor API response times
- Backup admin configurations
- Test all critical flows

## 📞 Support

For technical support or questions:
- **Email**: admin@agri-connect.com
- **Phone**: +91-9606860853

## 📄 License

This admin portal is part of the Agri-Connect platform and follows the same licensing terms.
