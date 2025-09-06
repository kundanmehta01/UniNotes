// Simple debug script to test frontend -> backend connection
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

async function testLogin() {
  console.log('Testing login API connection...');
  
  // Test credentials that we know work from our backend tests
  const testCredentials = [
    { email: "admin@test.com", password: "AdminUser123!" },
    { email: "verified@test.com", password: "VerifiedUser123!" }, // If this user exists
  ];
  
  for (const creds of testCredentials) {
    console.log(`\n🧪 Testing login with: ${creds.email}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: creds.email,
        password: creds.password,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      console.log('✅ Login successful!');
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      
      if (response.data.access_token) {
        console.log('🎫 Token received:', response.data.access_token.substring(0, 50) + '...');
      }
      
      if (response.data.user) {
        console.log('👤 User info:', {
          email: response.data.user.email,
          role: response.data.user.role,
          verified: response.data.user.is_email_verified
        });
      }
      
      return; // Exit after first successful login
      
    } catch (error) {
      console.log('❌ Login failed for', creds.email);
      console.log('Status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Error message:', error.message);
    }
  }
}

// Test basic connectivity
async function testConnectivity() {
  console.log('🌐 Testing basic connectivity to backend...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/healthz`, { timeout: 5000 });
    console.log('✅ Backend is reachable!');
    console.log('Health check response:', response.data);
  } catch (error) {
    console.log('❌ Cannot reach backend!');
    console.log('Error:', error.message);
    console.log('Make sure backend is running on', API_BASE_URL);
  }
}

async function main() {
  console.log('🚀 Frontend API Debug Tool');
  console.log('API URL:', API_BASE_URL);
  
  await testConnectivity();
  await testLogin();
}

main().catch(console.error);
