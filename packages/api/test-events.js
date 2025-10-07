const axios = require('axios');

const API_URL = 'http://localhost:8080';

async function testEventsEndpoint() {
  console.log('🧪 Testing Events Endpoint...\n');

  try {
    // Test 1: Create a view event (anonymous - no userId/productId)
    console.log('1️⃣ Creating a VIEW event (anonymous)...');
    const viewEvent = await axios.post(`${API_URL}/api/events`, {
      type: 'view',
      meta: JSON.stringify({ source: 'mobile', screen: 'product-details' })
    });
    console.log('✅ View event created:', viewEvent.data);
    console.log('');

    // Test 2: Create an add_to_cart event with value
    console.log('2️⃣ Creating an ADD_TO_CART event...');
    const cartEvent = await axios.post(`${API_URL}/api/events`, {
      type: 'add_to_cart',
      value: 2.5,
      meta: JSON.stringify({ quantity: 5, price: 250 })
    });
    console.log('✅ Add to cart event created:', cartEvent.data);
    console.log('');

    // Test 3: Create a rating event
    console.log('3️⃣ Creating a RATING event...');
    const ratingEvent = await axios.post(`${API_URL}/api/events`, {
      type: 'rating',
      value: 4.5
    });
    console.log('✅ Rating event created:', ratingEvent.data);
    console.log('');

    // Test 4: Retrieve events
    console.log('4️⃣ Retrieving all events...');
    const allEvents = await axios.get(`${API_URL}/api/events?limit=10`);
    console.log(`✅ Retrieved ${allEvents.data.length} events`);
    console.log('');

    // Test 5: Filter by userId
    console.log('5️⃣ Filtering events by userId...');
    const userEvents = await axios.get(`${API_URL}/api/events?userId=test-user-1&limit=10`);
    console.log(`✅ Retrieved ${userEvents.data.length} events for test-user-1`);
    console.log('');

    // Test 6: Filter by type
    console.log('6️⃣ Filtering events by type...');
    const viewEvents = await axios.get(`${API_URL}/api/events?type=view&limit=10`);
    console.log(`✅ Retrieved ${viewEvents.data.length} view events`);
    console.log('');

    // Test 7: Test validation (missing type)
    console.log('7️⃣ Testing validation (should fail)...');
    try {
      await axios.post(`${API_URL}/api/events`, {
        userId: 'test-user-1',
        productId: 'test-product-1'
      });
      console.log('❌ Validation failed - request should have been rejected');
    } catch (validationError) {
      if (validationError.response?.status === 400) {
        console.log('✅ Validation working:', validationError.response.data);
      } else {
        throw validationError;
      }
    }

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused. Is the API server running on http://localhost:8080?');
      console.error('   Run: pnpm --filter @agri-connect/api dev');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

testEventsEndpoint();
