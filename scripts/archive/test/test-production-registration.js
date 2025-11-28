#!/usr/bin/env node

/**
 * Test Production Registration Flow
 * 
 * This script tests the complete registration flow on production:
 * 1. Create test account
 * 2. Submit membership application
 * 3. Verify application was created
 * 4. Clean up test data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Generate unique test email
const timestamp = Date.now();
const testEmail = `test-registration-${timestamp}@example.com`;
const testPassword = 'TestPassword123!';

console.log('🧪 Testing Production Registration Flow\n');
console.log('📧 Test Email:', testEmail);
console.log('🔗 Production URL:', SUPABASE_URL);
console.log('');

let testUserId = null;
let testApplicationId = null;
let authToken = null;

async function makeRequest(method, path, data, useServiceKey = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${useServiceKey ? SUPABASE_SERVICE_KEY : (authToken || SUPABASE_ANON_KEY)}`,
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function step1_CreateAccount() {
  console.log('📝 Step 1: Creating test account...');
  
  const response = await makeRequest('POST', '/auth/v1/signup', {
    email: testEmail,
    password: testPassword,
  });

  if (response.status === 200 || response.status === 201) {
    testUserId = response.data.user?.id;
    authToken = response.data.access_token;
    console.log('✅ Account created successfully');
    console.log('   User ID:', testUserId);
    return true;
  } else {
    console.error('❌ Failed to create account:', response.data);
    return false;
  }
}

async function step2_GetClubs() {
  console.log('\n📋 Step 2: Fetching available clubs...');
  
  const response = await makeRequest('GET', '/rest/v1/clubs?select=id,name,sport_type', null);

  if (response.status === 200 && response.data.length > 0) {
    console.log('✅ Found', response.data.length, 'clubs');
    response.data.forEach(club => {
      console.log(`   - ${club.name} (${club.sport_type})`);
    });
    return response.data[0].id; // Return first club ID
  } else {
    console.error('❌ Failed to fetch clubs:', response.data);
    return null;
  }
}

async function step3_SubmitApplication(clubId) {
  console.log('\n📤 Step 3: Submitting membership application...');
  
  const applicationData = {
    club_id: clubId,
    personal_info: {
      full_name: 'Test User Registration',
      nickname: 'Test',
      gender: 'male',
      date_of_birth: '2010-01-01',
      phone_number: '081-234-5678',
      address: '123 Test Street, Test City, Test Province 10000',
      emergency_contact: '081-234-5679',
      blood_type: 'O',
      medical_conditions: 'None',
    },
    documents: [
      {
        type: 'id_card',
        url: 'https://example.com/test-id-card.jpg',
        uploaded_at: new Date().toISOString(),
        file_name: 'test-id-card.jpg',
        file_size: 1024,
      },
      {
        type: 'house_registration',
        url: 'https://example.com/test-house-reg.jpg',
        uploaded_at: new Date().toISOString(),
        file_name: 'test-house-reg.jpg',
        file_size: 1024,
      },
      {
        type: 'birth_certificate',
        url: 'https://example.com/test-birth-cert.jpg',
        uploaded_at: new Date().toISOString(),
        file_name: 'test-birth-cert.jpg',
        file_size: 1024,
      },
    ],
    status: 'pending',
  };

  const response = await makeRequest('POST', '/rest/v1/membership_applications', applicationData);

  if (response.status === 201) {
    testApplicationId = response.data[0]?.id;
    console.log('✅ Application submitted successfully');
    console.log('   Application ID:', testApplicationId);
    return true;
  } else {
    console.error('❌ Failed to submit application:', response.data);
    return false;
  }
}

async function step4_VerifyApplication() {
  console.log('\n🔍 Step 4: Verifying application was created...');
  
  const response = await makeRequest(
    'GET',
    `/rest/v1/membership_applications?id=eq.${testApplicationId}&select=*`,
    null
  );

  if (response.status === 200 && response.data.length > 0) {
    const app = response.data[0];
    console.log('✅ Application verified');
    console.log('   Status:', app.status);
    console.log('   Club ID:', app.club_id);
    console.log('   Applicant:', app.personal_info.full_name);
    return true;
  } else {
    console.error('❌ Failed to verify application:', response.data);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Delete application
  if (testApplicationId) {
    await makeRequest(
      'DELETE',
      `/rest/v1/membership_applications?id=eq.${testApplicationId}`,
      null,
      true
    );
    console.log('✅ Deleted test application');
  }

  // Delete user (using service key)
  if (testUserId) {
    await makeRequest(
      'DELETE',
      `/auth/v1/admin/users/${testUserId}`,
      null,
      true
    );
    console.log('✅ Deleted test user');
  }
}

async function runTest() {
  try {
    // Step 1: Create account
    const accountCreated = await step1_CreateAccount();
    if (!accountCreated) {
      console.error('\n❌ Test failed at Step 1');
      process.exit(1);
    }

    // Step 2: Get clubs
    const clubId = await step2_GetClubs();
    if (!clubId) {
      console.error('\n❌ Test failed at Step 2');
      await cleanup();
      process.exit(1);
    }

    // Step 3: Submit application
    const applicationSubmitted = await step3_SubmitApplication(clubId);
    if (!applicationSubmitted) {
      console.error('\n❌ Test failed at Step 3');
      await cleanup();
      process.exit(1);
    }

    // Step 4: Verify application
    const applicationVerified = await step4_VerifyApplication();
    if (!applicationVerified) {
      console.error('\n❌ Test failed at Step 4');
      await cleanup();
      process.exit(1);
    }

    // Cleanup
    await cleanup();

    console.log('\n✅ All tests passed! Registration flow is working correctly on production.');
    console.log('\n📊 Summary:');
    console.log('   ✓ Account creation');
    console.log('   ✓ Club selection');
    console.log('   ✓ Application submission');
    console.log('   ✓ Application verification');
    console.log('   ✓ Data cleanup');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    await cleanup();
    process.exit(1);
  }
}

runTest();
