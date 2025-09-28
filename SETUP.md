# Agri-Connect Setup Guide

## Quick Start

### Windows Users
1. Double-click `start-dev.bat` to automatically set up and start all services
2. Wait for all services to start (API, Web, Mobile)
3. Access the applications:
   - **Web App**: http://localhost:5173
   - **API Server**: http://localhost:8080
   - **Mobile App**: Use Expo Go app on your phone

### Linux/Mac Users
1. Make the script executable: `chmod +x start-dev.sh`
2. Run: `./start-dev.sh`
3. Access the applications at the URLs above

## Manual Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- Git

### Step-by-Step Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment files
   cp packages/api/.env.example packages/api/.env
   cp apps/web/.env.example apps/web/.env
   
   # Edit the .env files if needed
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   cd packages/api
   pnpm prisma generate
   
   # Create database and tables
   pnpm prisma db push
   
   # Seed with sample data
   pnpm db:seed
   ```

4. **Start Development Servers**
   ```bash
   # Start all services (from root directory)
   pnpm dev
   
   # Or start individually:
   # API: cd packages/api && pnpm dev
   # Web: cd apps/web && pnpm dev
   # Mobile: cd apps/mobile && pnpm start
   ```

## Demo Accounts

The seed script creates these demo accounts (use any 6-digit code for OTP):

- **Admin**: +1234567890
- **Farmer**: +1987654321  
- **Customer**: +1122334455

## Features Included

### ✅ Completed Features
- **Authentication**: Phone OTP login/registration
- **User Management**: Customer, Farmer, Admin roles
- **Product Management**: CRUD operations with categories
- **Shopping Cart**: Add/remove items, quantity management
- **Order Management**: Place orders, track status
- **Real-time Chat**: Socket.IO integration
- **Payment Integration**: Razorpay (mock mode by default)
- **File Upload**: S3-compatible storage (mock mode by default)
- **Database**: SQLite with Prisma ORM
- **Responsive UI**: Modern React components with Tailwind CSS
- **Mobile App**: React Native with Expo

### 🏗️ Architecture
- **Frontend**: React (Web) + React Native (Mobile)
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite + Prisma ORM
- **Real-time**: Socket.IO
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite (Web), Expo (Mobile)

### 📱 Mobile Development
```bash
cd apps/mobile

# Start Expo development server
pnpm start

# Run on specific platforms
pnpm android  # Android emulator/device
pnpm ios      # iOS simulator/device
```

### 🔧 Configuration

#### API Configuration (packages/api/.env)
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server
PORT=8080
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key

# Services (set to 'mock' for development)
OTP_PROVIDER=mock
PAYMENTS_PROVIDER=mock
```

#### Web Configuration (apps/web/.env)
```env
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Change ports in environment files
   - Kill existing processes: `npx kill-port 8080 5173`

2. **Database Issues**
   - Reset database: `cd packages/api && pnpm prisma db push --force-reset`
   - Re-seed: `pnpm db:seed`

3. **Prisma Client Issues**
   - Regenerate client: `cd packages/api && pnpm prisma generate`

4. **Permission Errors (Windows)**
   - Run terminal as Administrator
   - Or use WSL for better compatibility

### Development Tips

- **Hot Reload**: All services support hot reload
- **API Documentation**: Visit http://localhost:8080/health for health check
- **Database Browser**: Run `cd packages/api && pnpm prisma studio`
- **Logs**: Check terminal windows for detailed logs

## Production Deployment

### API Deployment
1. Set production environment variables
2. Use PostgreSQL instead of SQLite
3. Configure Redis for sessions
4. Set up proper S3 storage
5. Configure Twilio for SMS
6. Set up Razorpay for payments

### Web Deployment
- Deploy to Vercel, Netlify, or similar
- Update `VITE_API_URL` to production API URL

### Mobile Deployment
- Use EAS Build for app store deployment
- Update API URL in app.json

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the logs in terminal windows
3. Ensure all prerequisites are installed
4. Try the manual setup steps if automated scripts fail
