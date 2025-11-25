#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Diagnoses JSON parsing errors
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  console.log('URL:', SUPABASE_URL);
  console.log('Anon Key:', SUPABASE_ANON_KEY?.substring(0, 20) + '...\n');

  try {
    // Test 1: Basic health check
    console.log('Test 1: Health Check');
    const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    console.log('Status:', healthResponse.status);
    console.log('Content-Type:', healthResponse.headers.get('content-type'));
    
    const healthText = await healthResponse.text();
    console.log('Response (first 200 chars):', healthText.substring(0, 200));
    
    if (healthResponse.headers.get('content-type')?.includes('application/json')) {
      try {
        const healthJson = JSON.parse(healthText);
        console.log('✅ JSON parsed successfully');
      } catch (e) {
        console.log('❌ JSON parse failed:', e.message);
        console.log('Full response:', healthText);
      }
    } else {
      console.log('⚠️  Response is not JSON');
      console.log('Full response:', healthText);
    }

    // Test 2: Auth endpoint
    console.log('\n\nTest 2: Auth Endpoint');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    console.log('Status:', authResponse.status);
    const authText = await authResponse.text();
    console.log('Response:', authText);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();
