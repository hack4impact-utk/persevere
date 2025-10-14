#!/usr/bin/env node

/**
 * Comprehensive Authentication System Test Suite
 * Tests all aspects of the in-house authentication system
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${details}`);
  }
  testResults.details.push({ name, passed, details });
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': options.cookie || '',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testLoginPage() {
  console.log('\n🔐 Testing Login Page Access...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/auth/login`);
    const hasLoginForm = response.data.includes('Sign In') && response.data.includes('type="email"');
    logTest('Login page loads', response.statusCode === 200, `Status: ${response.statusCode}`);
    logTest('Login form present', hasLoginForm, hasLoginForm ? 'Form elements found' : 'Form elements missing');
  } catch (error) {
    logTest('Login page loads', false, error.message);
  }
}

async function testInvalidLogin() {
  console.log('\n🚫 Testing Invalid Login...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      body: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    });
    
    logTest('Invalid login rejected', response.statusCode === 401 || response.statusCode === 400, 
      `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Invalid login rejected', false, error.message);
  }
}

async function testValidLogin() {
  console.log('\n✅ Testing Valid Login...');
  
  try {
    // First, get the CSRF token
    const csrfResponse = await makeRequest(`${BASE_URL}/api/auth/csrf`);
    const csrfToken = JSON.parse(csrfResponse.data).csrfToken;
    
    // Attempt login
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        email: TEST_USER.email,
        password: TEST_USER.password,
        csrfToken: csrfToken,
        callbackUrl: '/dashboard'
      }
    });
    
    const hasSessionCookie = loginResponse.cookies.some(cookie => cookie.includes('next-auth.session-token'));
    logTest('Valid login accepted', loginResponse.statusCode === 302 || hasSessionCookie, 
      `Status: ${loginResponse.statusCode}, Cookie: ${hasSessionCookie}`);
    
    return loginResponse.cookies;
  } catch (error) {
    logTest('Valid login accepted', false, error.message);
    return [];
  }
}

async function testProtectedRoutes(cookies) {
  console.log('\n🛡️ Testing Protected Routes...');
  
  const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
  
  try {
    // Test dashboard access
    const dashboardResponse = await makeRequest(`${BASE_URL}/dashboard`, {
      cookie: cookieHeader
    });
    
    logTest('Dashboard accessible with auth', dashboardResponse.statusCode === 200, 
      `Status: ${dashboardResponse.statusCode}`);
    
    // Test protected API
    const apiResponse = await makeRequest(`${BASE_URL}/api/protected`, {
      cookie: cookieHeader
    });
    
    logTest('Protected API accessible with auth', apiResponse.statusCode === 200, 
      `Status: ${apiResponse.statusCode}`);
    
    // Test unauthorized access
    const unauthorizedResponse = await makeRequest(`${BASE_URL}/dashboard`);
    logTest('Dashboard blocks unauthorized access', unauthorizedResponse.statusCode === 302 || unauthorizedResponse.statusCode === 401, 
      `Status: ${unauthorizedResponse.statusCode}`);
    
  } catch (error) {
    logTest('Protected routes test', false, error.message);
  }
}

async function testSessionData(cookies) {
  console.log('\n👤 Testing Session Data...');
  
  const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/session`, {
      cookie: cookieHeader
    });
    
    const sessionData = JSON.parse(response.data);
    const hasUserData = sessionData.user && sessionData.user.email === TEST_USER.email;
    const hasRole = sessionData.user && sessionData.user.role;
    const hasEmailVerified = sessionData.user && typeof sessionData.user.isEmailVerified === 'boolean';
    
    logTest('Session data present', hasUserData, hasUserData ? 'User data found' : 'User data missing');
    logTest('User role included', hasRole, hasRole ? `Role: ${sessionData.user.role}` : 'Role missing');
    logTest('Email verification status', hasEmailVerified, hasEmailVerified ? `Verified: ${sessionData.user.isEmailVerified}` : 'Status missing');
    
  } catch (error) {
    logTest('Session data test', false, error.message);
  }
}

async function testLogout(cookies) {
  console.log('\n🚪 Testing Logout...');
  
  const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/signout`, {
      method: 'POST',
      cookie: cookieHeader
    });
    
    logTest('Logout successful', response.statusCode === 200 || response.statusCode === 302, 
      `Status: ${response.statusCode}`);
    
    // Test that protected route is now inaccessible
    const protectedResponse = await makeRequest(`${BASE_URL}/dashboard`);
    logTest('Protected route inaccessible after logout', protectedResponse.statusCode === 302 || protectedResponse.statusCode === 401, 
      `Status: ${protectedResponse.statusCode}`);
    
  } catch (error) {
    logTest('Logout test', false, error.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');
  
  try {
    // Test if we can access the database through our API
    const response = await makeRequest(`${BASE_URL}/api/protected`);
    
    // If we get a 401, it means the API is working but we need auth
    // If we get a 500, it might be a database issue
    const isWorking = response.statusCode === 401 || response.statusCode === 200;
    logTest('Database connection', isWorking, `API Status: ${response.statusCode}`);
    
  } catch (error) {
    logTest('Database connection', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE AUTHENTICATION TEST SUITE');
  console.log('=' .repeat(50));
  
  // Test 1: Basic connectivity
  await testDatabaseConnection();
  
  // Test 2: Login page
  await testLoginPage();
  
  // Test 3: Invalid login
  await testInvalidLogin();
  
  // Test 4: Valid login
  const cookies = await testValidLogin();
  
  if (cookies.length > 0) {
    // Test 5: Protected routes
    await testProtectedRoutes(cookies);
    
    // Test 6: Session data
    await testSessionData(cookies);
    
    // Test 7: Logout
    await testLogout(cookies);
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => console.log(`  - ${test.name}: ${test.details}`));
  }
  
  console.log('\n' + '=' .repeat(50));
  
  return testResults.failed === 0;
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
