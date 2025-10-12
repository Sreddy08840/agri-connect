# ✅ AI Integration - Verification Checklist

Use this checklist to verify that the AI integration is working correctly across all platforms.

---

## 🔧 Pre-Verification Setup

### 1. Environment Configuration
- [ ] Backend `.env` file exists with `ML_BASE_URL=http://localhost:8000`
- [ ] Web `.env` file exists with `VITE_API_URL=http://localhost:8080/api`
- [ ] Mobile `.env` file exists with `EXPO_PUBLIC_API_URL` set to your local IP
- [ ] ML service `.env` file exists with correct paths

### 2. Dependencies Installed
- [ ] Backend: `cd packages/api && pnpm install`
- [ ] Web: `cd apps/web && pnpm install`
- [ ] Mobile: `cd apps/mobile && pnpm install`
- [ ] ML Service: `cd packages/ml && pip install -r requirements.txt`

---

## 🐳 Docker Verification

### Start Services
```bash
docker-compose up -d
```

- [ ] ML Service container is running
- [ ] Redis container is running
- [ ] PostgreSQL container is running (if using)
- [ ] All containers are healthy: `docker-compose ps`

### Check Logs
```bash
docker-compose logs ml-service
docker-compose logs api
```

- [ ] No error messages in ML service logs
- [ ] No error messages in API logs
- [ ] Services started successfully

---

## 🤖 ML Service Verification

### Health Check
```bash
curl http://localhost:8000/health
```
- [ ] Returns 200 OK
- [ ] Response shows service is healthy

### API Documentation
```bash
# Open in browser
http://localhost:8000/docs
```
- [ ] Swagger UI loads
- [ ] All endpoints are visible
- [ ] Can test endpoints from UI

### Test Endpoints

**Recommendations:**
```bash
curl "http://localhost:8000/recommendations/user/test-user?n=5"
```
- [ ] Returns 200 OK
- [ ] Returns recommendation data

**Chatbot:**
```bash
curl -X POST http://localhost:8000/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello"}'
```
- [ ] Returns 200 OK
- [ ] Returns chatbot response

**Forecast:**
```bash
curl -X POST http://localhost:8000/forecast/product/test-product \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```
- [ ] Returns 200 or 404 (expected if no data)
- [ ] Endpoint is accessible

---

## 🔌 Backend API Verification

### Start Backend
```bash
cd packages/api
pnpm dev
```
- [ ] Server starts on port 8080
- [ ] No compilation errors
- [ ] Routes loaded successfully

### Health Check
```bash
curl http://localhost:8080/api/ai/health
```
- [ ] Returns 200 OK
- [ ] Shows ML service status

### Test Public Endpoints

**Chatbot (No Auth):**
```bash
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Agri-Connect?"}'
```
- [ ] Returns 200 OK
- [ ] Returns AI response

**Similar Products (No Auth):**
```bash
curl "http://localhost:8080/api/ai/recommendations/similar/test-product?n=5"
```
- [ ] Returns 200 or 404
- [ ] Endpoint is accessible

### Test Authenticated Endpoints

**Get Auth Token:**
1. Login via web app or API
2. Copy JWT token

**Test Recommendations:**
```bash
curl http://localhost:8080/api/ai/recommendations?n=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
- [ ] Returns 200 OK (or 401 if token invalid)
- [ ] Returns recommendation data

---

## 🌐 Web App Verification

### Start Web App
```bash
cd apps/web
pnpm dev
```
- [ ] App starts on port 5173
- [ ] No compilation errors
- [ ] Opens in browser

### Test Features

**Homepage:**
- [ ] Page loads successfully
- [ ] No console errors
- [ ] Layout renders correctly

**Login as Customer:**
- [ ] Can login successfully
- [ ] Token is stored
- [ ] Redirected to homepage

**Recommendations Component:**
- [ ] Recommendations section appears on homepage
- [ ] Products are displayed with AI scores
- [ ] Images load correctly
- [ ] Can click on products

**AI Chatbot:**
- [ ] Chatbot button appears in bottom-right
- [ ] Can open chatbot
- [ ] Can send messages
- [ ] Receives AI responses
- [ ] Chat history persists

**Login as Farmer:**
- [ ] Can login as farmer
- [ ] Access to farmer dashboard

**AI Insights Page:**
- [ ] Navigate to `/farmer/ai-insights`
- [ ] Page loads without errors
- [ ] Analytics cards display data
- [ ] Revenue trend chart renders
- [ ] Can enter product ID for price prediction
- [ ] Can enter product ID for sales forecast
- [ ] Charts update when data loads

---

## 📱 Mobile App Verification

### Start Mobile App
```bash
cd apps/mobile
pnpm start
```
- [ ] Expo dev server starts
- [ ] QR code is displayed
- [ ] No compilation errors

### Test on Device/Emulator

**App Launch:**
- [ ] App loads successfully
- [ ] No crash on startup
- [ ] Can navigate between screens

**Login:**
- [ ] Can login as customer
- [ ] Can login as farmer
- [ ] Token is stored

**Recommendations (Customer):**
- [ ] Recommendations section appears on home
- [ ] Products display correctly
- [ ] Can scroll horizontally
- [ ] AI scores are visible
- [ ] Can tap on products

**AI Insights (Farmer):**
- [ ] Navigate to AI Insights screen
- [ ] Analytics cards display
- [ ] Revenue chart renders
- [ ] Data loads correctly
- [ ] Can refresh data

---

## 🔄 Integration Tests

### End-to-End Flow (Customer)

1. **Login**
   - [ ] Login successful
   - [ ] Token received

2. **View Recommendations**
   - [ ] Homepage shows recommendations
   - [ ] Products have AI scores
   - [ ] Can view product details

3. **Use Chatbot**
   - [ ] Can ask questions
   - [ ] Receives relevant answers
   - [ ] Conversation flows naturally

4. **Browse Products**
   - [ ] Similar products shown on product page
   - [ ] Recommendations are relevant

### End-to-End Flow (Farmer)

1. **Login**
   - [ ] Login successful
   - [ ] Access to farmer features

2. **View Analytics**
   - [ ] Dashboard shows metrics
   - [ ] Revenue, orders, products displayed
   - [ ] Charts render correctly

3. **Price Prediction**
   - [ ] Can select product
   - [ ] Receives price recommendation
   - [ ] Shows expected revenue increase

4. **Sales Forecast**
   - [ ] Can select product
   - [ ] Receives 30-day forecast
   - [ ] Chart displays forecast data

---

## 🧪 Automated Tests

### Run Test Script

**Windows:**
```bash
test-ai-integration.bat
```

**Linux/Mac:**
```bash
chmod +x test-ai-integration.sh
./test-ai-integration.sh
```

- [ ] All health checks pass
- [ ] ML service endpoints respond
- [ ] Backend endpoints respond
- [ ] No errors in output

---

## 🔍 Performance Checks

### Response Times

**ML Service:**
- [ ] Health check: < 100ms
- [ ] Recommendations: < 1s
- [ ] Chatbot: < 1s
- [ ] Forecast: < 3s

**Backend API:**
- [ ] Health check: < 100ms
- [ ] Recommendations (cached): < 200ms
- [ ] Analytics: < 500ms

**Frontend:**
- [ ] Page load: < 2s
- [ ] Component render: < 500ms
- [ ] API calls complete: < 2s

### Resource Usage

**Docker Containers:**
```bash
docker stats
```
- [ ] ML service: < 1GB RAM
- [ ] API service: < 500MB RAM
- [ ] Redis: < 100MB RAM
- [ ] CPU usage reasonable

---

## 🐛 Error Handling

### Test Error Scenarios

**Invalid Token:**
```bash
curl http://localhost:8080/api/ai/recommendations \
  -H "Authorization: Bearer invalid-token"
```
- [ ] Returns 401 Unauthorized
- [ ] Error message is clear

**ML Service Down:**
1. Stop ML service: `docker-compose stop ml-service`
2. Try recommendations endpoint
   - [ ] Returns graceful error
   - [ ] Doesn't crash backend

**Invalid Product ID:**
```bash
curl -X POST http://localhost:8080/api/ai/price-predict \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "invalid-id"}'
```
- [ ] Returns appropriate error
- [ ] Error message is helpful

---

## 📊 Data Verification

### Database Checks

**Products Exist:**
- [ ] Database has products
- [ ] Products have categories
- [ ] Products have farmers

**User Interactions:**
- [ ] Events table has data
- [ ] Orders exist
- [ ] Reviews exist (for ratings)

**ML Models:**
- [ ] Models directory exists: `packages/ml/models/`
- [ ] Vector store exists: `packages/ml/vectors/`
- [ ] Models load successfully

---

## 🔐 Security Checks

**Authentication:**
- [ ] Protected endpoints require token
- [ ] Invalid tokens are rejected
- [ ] Token expiration works

**Authorization:**
- [ ] Farmers can only access their data
- [ ] Customers can't access farmer endpoints
- [ ] Admin endpoints require admin role

**Rate Limiting:**
- [ ] Multiple rapid requests are throttled
- [ ] Rate limit headers present

---

## 📱 Cross-Platform Checks

### Web Browsers
- [ ] Chrome: Works correctly
- [ ] Firefox: Works correctly
- [ ] Safari: Works correctly
- [ ] Edge: Works correctly

### Mobile Platforms
- [ ] iOS Simulator: Works correctly
- [ ] Android Emulator: Works correctly
- [ ] Physical iOS Device: Works correctly
- [ ] Physical Android Device: Works correctly

### Screen Sizes
- [ ] Desktop (1920x1080): Responsive
- [ ] Tablet (768x1024): Responsive
- [ ] Mobile (375x667): Responsive

---

## 📝 Documentation Checks

- [ ] `AI_INTEGRATION_COMPLETE_GUIDE.md` exists
- [ ] `AI_INTEGRATION_SUMMARY.md` exists
- [ ] `AI_QUICK_REFERENCE.md` exists
- [ ] `VERIFICATION_CHECKLIST.md` exists (this file)
- [ ] Test scripts exist
- [ ] All files are up to date

---

## ✅ Final Verification

### All Systems Go?
- [ ] ML service is running and healthy
- [ ] Backend API is running and connected
- [ ] Web app displays AI features
- [ ] Mobile app displays AI features
- [ ] All endpoints respond correctly
- [ ] No critical errors in logs
- [ ] Performance is acceptable
- [ ] Security measures are in place

### Ready for:
- [ ] Local development ✅
- [ ] Team testing ✅
- [ ] User acceptance testing ✅
- [ ] Production deployment (after testing)

---

## 🚨 If Something Fails

### Troubleshooting Steps:

1. **Check Logs:**
   ```bash
   docker-compose logs ml-service
   docker-compose logs api
   ```

2. **Verify Environment:**
   - Check all `.env` files
   - Verify URLs and ports
   - Confirm database connection

3. **Restart Services:**
   ```bash
   docker-compose restart
   ```

4. **Rebuild Containers:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Check Network:**
   - Verify firewall settings
   - Confirm ports are open
   - Test with curl

6. **Review Documentation:**
   - Read `AI_INTEGRATION_COMPLETE_GUIDE.md`
   - Check troubleshooting section
   - Review error messages

---

## 📞 Support

If you encounter issues:
1. Check this verification checklist
2. Review the troubleshooting guide
3. Check service logs
4. Verify environment configuration
5. Contact development team

---

**Date Completed:** _______________  
**Verified By:** _______________  
**Status:** [ ] Pass [ ] Fail [ ] Partial  
**Notes:** _______________

---

**Keep this checklist for future deployments and updates!** 📋
