@echo off
REM AI Integration Testing Script for Windows
REM This script tests all AI endpoints and verifies the integration

echo ========================================
echo 🤖 AI Integration Testing Script
echo ========================================
echo.

set API_BASE=http://localhost:8080/api
set ML_BASE=http://localhost:8000

REM Test 1: ML Service Health
echo Test 1: ML Service Health Check
curl -s -o nul -w "HTTP Status: %%{http_code}" %ML_BASE%/health
echo.
echo.

REM Test 2: Backend AI Health
echo Test 2: Backend AI Health Check
curl -s -o nul -w "HTTP Status: %%{http_code}" %API_BASE%/ai/health
echo.
echo.

REM Test 3: ML Service Endpoints
echo Test 3: ML Service Endpoints
echo.

echo Testing recommendations endpoint...
curl -s -o nul -w "HTTP Status: %%{http_code}" "%ML_BASE%/recommendations/user/test-user?n=5"
echo.

echo Testing chatbot endpoint...
curl -s -X POST %ML_BASE%/chat/query -H "Content-Type: application/json" -d "{\"query\": \"Hello\"}" -o nul -w "HTTP Status: %%{http_code}"
echo.
echo.

REM Test 4: Backend Integration
echo Test 4: Backend AI Integration
echo Testing public chatbot endpoint...
curl -s -X POST %API_BASE%/ai/chat -H "Content-Type: application/json" -d "{\"query\": \"What is Agri-Connect?\"}" -o nul -w "HTTP Status: %%{http_code}"
echo.
echo.

REM Summary
echo ========================================
echo ✓ AI Integration Tests Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Test with authentication tokens
echo 2. Verify web app at http://localhost:5173
echo 3. Test mobile app with Expo
echo 4. Check Docker services: docker-compose ps
echo.
pause
