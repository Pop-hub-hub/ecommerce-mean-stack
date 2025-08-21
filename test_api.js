const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('Health check:', healthResponse.data);
    
    // Test admin users endpoint (without auth - should fail)
    console.log('\n2. Testing admin users endpoint (without auth)...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`);
      console.log('Users response:', usersResponse.data);
    } catch (error) {
      console.log('Expected error (no auth):', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\nAPI test completed!');
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();
