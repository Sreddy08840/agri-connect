# 🚀 Agri-Connect - Complete Startup Guide

## ⚡ Quick Start (3 Steps)

### Step 1: Pre-flight Check
```bash
pre-flight-check.bat
```
This verifies all requirements are installed.

### Step 2: Fix Common Issues (First Time Only)
```bash
fix-common-issues.bat
```
This sets up environment files and installs dependencies.

### Step 3: Start All Services
```bash
start-all-services.bat
```
This starts everything in the correct order!

---

## 📋 Detailed Instructions

### First Time Setup

1. **Run Pre-flight Check**
   ```bash
   pre-flight-check.bat
   ```
   - Checks Node.js, Python, Docker, pnpm
   - Verifies ports are available
   - Confirms project structure

2. **Fix Any Issues**
   ```bash
   fix-common-issues.bat
   ```
   - Creates .env files from examples
   - Installs all dependencies
   - Generates Prisma client
   - Creates necessary directories

3. **Configure Environment Variables**
   
   **Backend** (`packages/api/.env`):
   ```bash
   ML_BASE_URL=http://localhost:8000
   REDIS_URL=redis://localhost:6380
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=your-secret-key-here
   ```

   **Web** (`apps/web/.env`):
   ```bash
   VITE_API_URL=http://localhost:8080/api
   VITE_SOCKET_URL=http://localhost:8080
   ```

   **Mobile** (`apps/mobile/.env`):
   ```bash
   # For physical device, use your computer's IP
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api
   
   # For Android Emulator
   # EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api
   
   # For iOS Simulator
   # EXPO_PUBLIC_API_URL=http://localhost:8080/api
   ```

4. **Start All Services**
   ```bash
   start-all-services.bat
   ```

---

## 🎯 What Gets Started

When you run `start-all-services.bat`, the following services start:

1. **Redis** (Port 6380) - Caching layer
2. **ML Service** (Port 8000) - AI/ML microservice
3. **Backend API** (Port 8080) - Node.js Express server
4. **Web App** (Port 5173) - React web application

---

## 🌐 Access Your Services

After starting, open these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:5173 | Main web application |
| **Backend API** | http://localhost:8080 | REST API |
| **ML Service** | http://localhost:8000 | ML microservice |
| **ML API Docs** | http://localhost:8000/docs | Interactive API docs |

---

## 📱 Starting Mobile App

The mobile app needs to be started separately:

```bash
cd apps/mobile
pnpm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

---

## 🧪 Testing the Integration

After all services are running:

```bash
test-ai-integration.bat
```

This tests:
- ML service health
- Backend API connectivity
- AI endpoints functionality
- Integration between services

---

## 🛑 Stopping Services

### Stop Docker Services
```bash
docker-compose down
```

### Stop Backend API & Web App
Close the terminal windows that opened, or press `Ctrl+C` in each.

---

## 🔧 Troubleshooting

### Issue: Port Already in Use

**Solution:**
```bash
# Find what's using the port (example for port 8080)
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Docker Not Starting

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start
3. Run `docker ps` to verify
4. Try `start-all-services.bat` again

### Issue: ML Service Not Healthy

**Solution:**
```bash
# Check logs
docker-compose logs ml-service

# Restart ML service
docker-compose restart ml-service

# Rebuild if needed
docker-compose up -d --build ml-service
```

### Issue: Backend Can't Connect to ML Service

**Solution:**
1. Verify ML service is running: `curl http://localhost:8000/health`
2. Check `packages/api/.env` has `ML_BASE_URL=http://localhost:8000`
3. Restart backend API

### Issue: Dependencies Not Installing

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules
rmdir /s /q node_modules
rmdir /s /q packages\api\node_modules
rmdir /s /q apps\web\node_modules
rmdir /s /q apps\mobile\node_modules

# Reinstall
pnpm install
```

### Issue: Prisma Client Errors

**Solution:**
```bash
cd packages/api
pnpm prisma generate
pnpm prisma db push
cd ../..
```

### Issue: Python Dependencies Failing

**Solution:**
```bash
cd packages/ml

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt --force-reinstall

cd ../..
```

---

## 📊 Monitoring Services

### Check Docker Services
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ml-service
docker-compose logs -f redis
```

### Check Service Health
```bash
# ML Service
curl http://localhost:8000/health

# Backend API
curl http://localhost:8080/api/ai/health

# Redis
docker-compose exec redis redis-cli ping
```

---

## 🔄 Restarting Services

### Restart Everything
```bash
docker-compose restart
```

### Restart Specific Service
```bash
docker-compose restart ml-service
docker-compose restart redis
```

### Full Reset
```bash
# Stop everything
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Start fresh
start-all-services.bat
```

---

## 📝 Development Workflow

### Daily Development

1. **Start Services**
   ```bash
   start-all-services.bat
   ```

2. **Make Changes**
   - Edit code in your IDE
   - Changes auto-reload (hot reload enabled)

3. **Test Changes**
   - Web: Refresh browser
   - Mobile: Shake device → Reload
   - API: Automatically restarts

4. **Stop When Done**
   ```bash
   docker-compose down
   ```
   Close terminal windows

### Adding New Features

1. **Backend API**
   - Add routes in `packages/api/src/routes/`
   - Update types in `packages/api/src/types/`
   - Server auto-restarts

2. **Web App**
   - Add components in `apps/web/src/components/`
   - Add pages in `apps/web/src/pages/`
   - Browser auto-refreshes

3. **Mobile App**
   - Add screens in `apps/mobile/src/screens/`
   - Add components in `apps/mobile/src/components/`
   - Expo auto-reloads

4. **ML Service**
   - Add endpoints in `packages/ml/app/api/`
   - Add models in `packages/ml/training/`
   - Restart ML service: `docker-compose restart ml-service`

---

## 🎓 Learning Resources

### Documentation
- **Complete Guide**: `AI_INTEGRATION_COMPLETE_GUIDE.md`
- **Quick Reference**: `AI_QUICK_REFERENCE.md`
- **API Summary**: `AI_INTEGRATION_SUMMARY.md`
- **Testing**: `VERIFICATION_CHECKLIST.md`

### API Documentation
- **ML Service**: http://localhost:8000/docs (Swagger UI)
- **Backend Routes**: See `packages/api/src/routes/`

---

## ✅ Success Checklist

After starting services, verify:

- [ ] Docker containers running: `docker-compose ps`
- [ ] ML service healthy: http://localhost:8000/health
- [ ] Backend API responding: http://localhost:8080/api/ai/health
- [ ] Web app loads: http://localhost:5173
- [ ] No errors in terminal windows
- [ ] Can login to web app
- [ ] Recommendations appear on homepage
- [ ] AI chatbot responds

---

## 🆘 Getting Help

### Check Logs First
```bash
# Docker services
docker-compose logs -f

# Backend API
# Check the terminal window running the API

# Web App
# Check browser console (F12)
```

### Common Commands
```bash
# Status check
docker-compose ps

# Restart everything
docker-compose restart

# View resource usage
docker stats

# Clean up
docker-compose down
docker system prune
```

### Still Having Issues?

1. Run `pre-flight-check.bat` again
2. Run `fix-common-issues.bat`
3. Check `VERIFICATION_CHECKLIST.md`
4. Review error messages in logs
5. Check troubleshooting section above

---

## 🎉 You're Ready!

Once all services are running:

1. **Open Web App**: http://localhost:5173
2. **Login or Register**
3. **Explore AI Features**:
   - View personalized recommendations
   - Chat with AI assistant
   - Check farmer analytics (if farmer account)
   - Browse products with AI suggestions

---

## 📞 Quick Reference

```bash
# Setup (first time)
pre-flight-check.bat
fix-common-issues.bat

# Start services
start-all-services.bat

# Test integration
test-ai-integration.bat

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

---

**Happy Coding! 🚀**
