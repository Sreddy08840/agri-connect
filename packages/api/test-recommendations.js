/**
 * Test script for ML recommendations API
 * 
 * Prerequisites:
 * 1. ML service running on port 8000
 * 2. API server running on port 8080
 * 3. Database has products and events
 * 
 * Usage: node test-recommendations.js
 */

const API_BASE = 'http://localhost:8080';

async function testRecommendations() {
  console.log('🧪 Testing ML Recommendations API\n');
  console.log('=' .repeat(50));

  // Test 1: Get recommendations for user 1
  console.log('\n📊 Test 1: Get recommendations for user 1');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations?userId=1&n=5`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log(`   User ID: ${data.userId}`);
      console.log(`   Recommendations: ${data.count || data.items?.length || 0} products`);
      
      if (data.items && data.items.length > 0) {
        console.log('\n   Top recommendations:');
        data.items.slice(0, 3).forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.name} (Score: ${item.recommendationScore?.toFixed(3) || 'N/A'})`);
          console.log(`      Category: ${item.category?.name || 'N/A'}`);
          console.log(`      Price: ₹${item.price} per ${item.unit}`);
        });
      } else {
        console.log('   ⚠️  No recommendations returned (user may have no viewing history)');
      }
    } else {
      console.log('❌ Failed:', data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('   Make sure ML service is running on port 8000');
  }

  // Test 2: Get more recommendations
  console.log('\n📊 Test 2: Get 10 recommendations for user 1');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations?userId=1&n=10`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Got ${data.count} recommendations`);
    } else {
      console.log('❌ Failed:', data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Test with invalid user ID
  console.log('\n📊 Test 3: Test with invalid user ID');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations?userId=invalid`);
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Correctly rejected invalid userId');
    } else {
      console.log('⚠️  Expected 400 error, got:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Refresh ML index
  console.log('\n📊 Test 4: Refresh ML index');
  try {
    const response = await fetch(`${API_BASE}/api/recommendations/refresh`, {
      method: 'POST',
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ ML index refreshed successfully');
      console.log('   Status:', data.status);
    } else {
      console.log('❌ Failed:', data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Testing complete!\n');
}

// Run tests
testRecommendations().catch(console.error);
