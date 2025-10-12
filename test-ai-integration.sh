#!/bin/bash

# AI Integration Testing Script
# This script tests all AI endpoints and verifies the integration

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:8080/api"
ML_BASE="http://localhost:8000"

echo -e "${YELLOW}🤖 AI Integration Testing Script${NC}"
echo "=================================="
echo ""

# Test 1: ML Service Health
echo -e "${YELLOW}Test 1: ML Service Health Check${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" ${ML_BASE}/health)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓ ML Service is healthy${NC}"
else
    echo -e "${RED}✗ ML Service is not responding (HTTP $response)${NC}"
    exit 1
fi
echo ""

# Test 2: Backend AI Health
echo -e "${YELLOW}Test 2: Backend AI Health Check${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_BASE}/ai/health)
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓ Backend AI routes are accessible${NC}"
else
    echo -e "${RED}✗ Backend AI routes are not responding (HTTP $response)${NC}"
    exit 1
fi
echo ""

# Test 3: ML Service Endpoints
echo -e "${YELLOW}Test 3: ML Service Endpoints${NC}"

# Test recommendations endpoint
echo "Testing recommendations endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" "${ML_BASE}/recommendations/user/test-user?n=5")
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓ Recommendations endpoint working${NC}"
else
    echo -e "${RED}✗ Recommendations endpoint failed (HTTP $response)${NC}"
fi

# Test forecast endpoint
echo "Testing forecast endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${ML_BASE}/forecast/product/test-product" \
    -H "Content-Type: application/json" \
    -d '{"days": 30}')
if [ $response -eq 200 ] || [ $response -eq 404 ]; then
    echo -e "${GREEN}✓ Forecast endpoint accessible${NC}"
else
    echo -e "${RED}✗ Forecast endpoint failed (HTTP $response)${NC}"
fi

# Test chatbot endpoint
echo "Testing chatbot endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${ML_BASE}/chat/query" \
    -H "Content-Type: application/json" \
    -d '{"query": "Hello, how are you?"}')
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓ Chatbot endpoint working${NC}"
else
    echo -e "${RED}✗ Chatbot endpoint failed (HTTP $response)${NC}"
fi
echo ""

# Test 4: Backend Integration
echo -e "${YELLOW}Test 4: Backend AI Integration${NC}"
echo "Note: These tests require authentication token"
echo "Testing public chatbot endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_BASE}/ai/chat" \
    -H "Content-Type: application/json" \
    -d '{"query": "What is Agri-Connect?"}')
if [ $response -eq 200 ]; then
    echo -e "${GREEN}✓ Backend chatbot integration working${NC}"
else
    echo -e "${RED}✗ Backend chatbot integration failed (HTTP $response)${NC}"
fi
echo ""

# Test 5: Check Services Running
echo -e "${YELLOW}Test 5: Service Status${NC}"

# Check if ML service is running
if pgrep -f "uvicorn.*app.main:app" > /dev/null; then
    echo -e "${GREEN}✓ ML Service process is running${NC}"
else
    echo -e "${YELLOW}⚠ ML Service process not found (may be running in Docker)${NC}"
fi

# Check if backend is running
if pgrep -f "node.*index" > /dev/null || pgrep -f "tsx.*index.ts" > /dev/null; then
    echo -e "${GREEN}✓ Backend API process is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend API process not found (may be running in Docker)${NC}"
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✓ AI Integration Tests Complete!${NC}"
echo ""
echo "Next Steps:"
echo "1. Test with authentication tokens"
echo "2. Verify web app at http://localhost:5173"
echo "3. Test mobile app with Expo"
echo "4. Check Docker services: docker-compose ps"
echo ""
