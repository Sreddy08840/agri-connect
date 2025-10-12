#!/usr/bin/env node

/**
 * Test script to verify ML service connection
 */

const fetch = require('node-fetch');

const ML_BASE_URL = process.env.ML_BASE_URL || 'http://localhost:8000';

async function testMLConnection() {
  console.log('🔍 Testing ML Service Connection...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing ML Service Health...');
    const healthResponse = await fetch(`${ML_BASE_URL}/docs`);
    if (healthResponse.ok) {
      console.log('✅ ML Service is running and accessible');
    } else {
      console.log('❌ ML Service health check failed');
      return;
    }

    // Test 2: Recommendations Endpoint
    console.log('\n2. Testing Recommendations Endpoint...');
    const recResponse = await fetch(`${ML_BASE_URL}/recommendations?userId=1&n=3`);
    if (recResponse.ok) {
      const data = await recResponse.json();
      console.log('✅ Recommendations endpoint working');
      console.log(`   Found ${data.items.length} recommendations for user 1`);
    } else {
      console.log('❌ Recommendations endpoint failed');
    }

    // Test 3: Refresh Endpoint
    console.log('\n3. Testing Refresh Endpoint...');
    const refreshResponse = await fetch(`${ML_BASE_URL}/refresh`, { method: 'POST' });
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      console.log('✅ Refresh endpoint working');
      console.log(`   Status: ${data.status}`);
    } else {
      console.log('❌ Refresh endpoint failed');
    }

    console.log('\n🎉 ML Service Connection Test Complete!');
    console.log(`📍 ML Service URL: ${ML_BASE_URL}`);

  } catch (error) {
    console.error('❌ Error testing ML service:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure ML service is running: python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8000');
    console.log('2. Check ML_BASE_URL environment variable');
    console.log('3. Verify port 8000 is not blocked');
  }
}

testMLConnection();
