const axios = require('axios');

async function testProfileUpdate() {
  try {
    console.log('🧪 Testing profile update with empty email...\n');
    
    // First, login to get a token
    console.log('Step 1: Login as farmer...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login-password', {
      phone: '+918618808929',
      password: 'Santosh@1234'
    });
    
    if (!loginResponse.data.pendingSessionId) {
      console.error('❌ No pending session ID received');
      return;
    }
    
    console.log('✅ Login initiated. Pending Session ID:', loginResponse.data.pendingSessionId);
    
    // For testing, we need the OTP code
    if (!loginResponse.data.code) {
      console.log('⚠️  OTP code not available in development mode');
      console.log('Manual step required: Use the OTP from SMS/console to verify');
      return;
    }
    
    console.log('🔑 OTP Code:', loginResponse.data.code);
    
    // Verify OTP
    console.log('\nStep 2: Verifying OTP...');
    const verifyResponse = await axios.post('http://localhost:3001/api/auth/verify-otp', {
      pendingSessionId: loginResponse.data.pendingSessionId,
      code: loginResponse.data.code
    });
    
    console.log('✅ OTP verified successfully');
    const token = verifyResponse.data.accessToken;
    
    // Test 1: Update profile with empty email (should work now)
    console.log('\nStep 3: Testing profile update with empty email...');
    try {
      const updateResponse = await axios.patch(
        'http://localhost:3001/api/users/me',
        {
          name: 'Test Farmer',
          email: '', // Empty string - this was causing 400 error
          address: 'Test Address'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Profile update with empty email succeeded!');
      console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.error('❌ Profile update failed:', error.response.status, error.response.data);
      } else {
        console.error('❌ Error:', error.message);
      }
      return;
    }
    
    // Test 2: Update profile with valid email
    console.log('\nStep 4: Testing profile update with valid email...');
    try {
      const updateResponse2 = await axios.patch(
        'http://localhost:3001/api/users/me',
        {
          name: 'Test Farmer',
          email: 'test@example.com',
          address: 'Updated Address',
          farmerProfile: {
            businessName: 'Test Farm'
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Profile update with valid email succeeded!');
      console.log('Response:', JSON.stringify(updateResponse2.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.error('❌ Profile update failed:', error.response.status, error.response.data);
      } else {
        console.error('❌ Error:', error.message);
      }
      return;
    }
    
    // Test 3: Update profile without email field
    console.log('\nStep 5: Testing profile update without email field...');
    try {
      const updateResponse3 = await axios.patch(
        'http://localhost:3001/api/users/me',
        {
          name: 'Test Farmer Updated',
          address: 'Final Address'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Profile update without email field succeeded!');
      console.log('Response:', JSON.stringify(updateResponse3.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.error('❌ Profile update failed:', error.response.status, error.response.data);
      } else {
        console.error('❌ Error:', error.message);
      }
      return;
    }
    
    console.log('\n🎉 All profile update tests passed!');
    
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

testProfileUpdate();
