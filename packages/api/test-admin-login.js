const axios = require('axios');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login API...\n');
    
    const phone = '+918618808929';
    const password = 'Santosh@1234';
    
    console.log(`Testing credentials:`);
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}\n`);
    
    // Test Step 1: Login with password
    console.log('Step 1: Testing /auth/login-password...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login-password', {
      phone,
      password
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.pendingSessionId) {
      console.log(`\n📱 OTP sent! Pending Session ID: ${loginResponse.data.pendingSessionId}`);
      if (loginResponse.data.code) {
        console.log(`🔑 Development OTP Code: ${loginResponse.data.code}`);
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused. Is the API server running on http://localhost:3001?');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testAdminLogin();
