# 📱 Mobile App Network Fix - Complete Guide

## 🎯 Problem Fixed

The mobile app was showing **"Network Error"** because it was configured to use `localhost:8080`, which doesn't work on physical devices or emulators (localhost refers to the device itself, not your computer).

## ✅ Changes Made

### 1. **Updated Mobile App Configuration**
- **File**: `apps/mobile/app.config.js`
- **File**: `apps/mobile/app.json`
- **File**: `apps/mobile/utils/constants.ts`
- **Changed**: API URL from `http://localhost:8080/api` to `http://192.168.30.223:8080/api`
- **Your Computer's IP**: `192.168.30.223`

### 2. **Updated Backend CORS Configuration**
- **File**: `packages/api/src/index.ts`
- **Added**: Support for local network IP addresses
- **Allows**: Requests from mobile devices on the same WiFi network

### 3. **Improved Error Handling**
- **File**: `apps/mobile/services/api.ts`
- **Added**: Better error messages for network issues
- **Added**: Detailed console logging for debugging

## 🔧 How It Works

### Database Architecture
```
┌─────────────────┐
│   Mobile App    │────┐
└─────────────────┘    │
                       │
┌─────────────────┐    │    ┌──────────────────┐    ┌─────────────┐
│    Web App      │────┼───►│  Backend API     │───►│   SQLite    │
└─────────────────┘    │    │  Port: 8080      │    │   Database  │
                       │    └──────────────────┘    │  dev.db     │
┌─────────────────┐    │                            └─────────────┘
│   Admin Panel   │────┘
└─────────────────┘
```

- **Backend Server**: Running on `http://192.168.30.223:8080`
- **Database**: SQLite at `packages/api/prisma/dev.db`
- **All apps** (Mobile, Web, Admin) connect to the **same backend API**
- **Same database** is used by all apps - they share all data

## 🚀 How to Start

### Step 1: Start the Backend API Server

Open a terminal and run:

```bash
cd packages/api
pnpm dev
```

**Verify it's running**: Open browser to [http://localhost:8080/health](http://localhost:8080/health)

You should see:
```json
{"status":"ok","timestamp":"2025-10-02T..."}
```

### Step 2: Start the Mobile App

Open another terminal and run:

```bash
cd apps/mobile
pnpm start
```

This will open Expo Dev Tools. Then:
- **For Android**: Press `a` to open in Android emulator
- **For iOS**: Press `i` to open in iOS simulator  
- **For Physical Device**: Scan QR code with Expo Go app

### Step 3: (Optional) Start the Web App

Open another terminal and run:

```bash
cd apps/web
pnpm dev
```

Open browser to [http://localhost:5173](http://localhost:5173)

## 📱 Testing the Mobile App

1. **Start the backend** first (Step 1 above)
2. **Start the mobile app** (Step 2 above)
3. **Check the console logs** in your terminal - you should see:
   ```
   📡 API Base URL: http://192.168.30.223:8080/api
   ```
4. **Try to login or signup** - it should now connect successfully!

## ⚠️ Important Notes

### If Your Computer's IP Changes

Your local IP address can change when you reconnect to WiFi. If the mobile app stops working:

1. **Find your current IP**:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (something like `192.168.x.x`)

2. **Update these files**:
   - `apps/mobile/app.config.js` - line 27
   - `apps/mobile/app.json` - line 25
   - `apps/mobile/utils/constants.ts` - line 6

3. **Restart the mobile app**

### Troubleshooting

#### ❌ "Cannot connect to server"
- **Check**: Backend is running on port 8080
- **Run**: `netstat -ano | findstr :8080` to verify
- **Solution**: Start the backend with `cd packages/api && pnpm dev`

#### ❌ "Network Error" still appears
- **Check**: Mobile device is on the **same WiFi network** as your computer
- **Check**: Your computer's firewall allows connections on port 8080
- **Solution**: Add firewall rule:
  ```bash
  netsh advfirewall firewall add rule name="AgriConnect API" dir=in action=allow protocol=TCP localport=8080
  ```

#### ❌ Different error on mobile vs web
- **Web app** uses `localhost:8080` (only works on same machine)
- **Mobile app** uses `192.168.30.223:8080` (works on network)
- Both are correct for their platforms!

## 🔍 Verify Database Connection

All apps share the same database. To verify:

1. **Create a product** in the web app
2. **Check mobile app** - product should appear
3. **Database location**: `packages/api/prisma/dev.db`

You can inspect the database with:
```bash
cd packages/api
pnpm db:studio
```

## 📊 Quick Start Script

Want to start everything at once? Run from the root folder:

```bash
# Windows
.\start-dev.bat

# Linux/Mac
./start-dev.sh
```

This starts:
- ✅ Backend API (port 8080)
- ✅ Web App (port 5173)
- ✅ Mobile App (Expo)

## 🎉 Success Indicators

You'll know everything is working when you see:

1. **Backend Console**:
   ```
   🚀 Server running on port 8080
   📱 Health check: http://localhost:8080/health
   ```

2. **Mobile Console**:
   ```
   📡 API Base URL: http://192.168.30.223:8080/api
   Metro waiting on exp://...
   ```

3. **Mobile App**: No more "Network Error" warnings - you can login/signup!

## 🆘 Need Help?

Check the logs:
- **Backend logs**: In terminal where you ran `pnpm dev` in packages/api
- **Mobile logs**: In terminal where you ran `pnpm start` in apps/mobile
- **React Native logs**: Use React Native Debugger or press `m` in Metro bundler

---

**All set!** Your mobile app should now connect to the backend at `http://192.168.30.223:8080` and use the same database as the web app. 🎊
