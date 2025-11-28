#!/usr/bin/env node

/**
 * Create User Account (Bypass Rate Limiting)
 * 
 * This script uses the Supabase Admin API to create a user account,
 * which bypasses rate limiting completely.
 * 
 * Usage:
 *   node scripts/create-user-for-rate-limited.js <email> <password> <full_name>
 * 
 * Example:
 *   node scripts/create-user-for-rate-limited.js user@example.com MyPassword123! "ชื่อ นามสกุล"
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Get command line arguments
const [email, password, fullName] = process.argv.slice(2);

if (!email || !password || !fullName) {
  console.error('❌ Error: Missing required arguments');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/create-user-for-rate-limited.js <email> <password> <full_name>');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/create-user-for-rate-limited.js user@example.com MyPassword123! "ชื่อ นามสกุล"');
  process.exit(1);
}

async function createUser() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Create User (Bypass Rate Limiting)                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Email: ${email}`);
  console.log(`Full Name: ${fullName}`);
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Create user using Admin API (bypasses rate limiting)
    console.log('Creating user account...');
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      console.error('❌ Error creating user:', createError.message);
      process.exit(1);
    }

    if (!userData.user) {
      console.error('❌ Error: Failed to create user');
      process.exit(1);
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${userData.user.id}`);
    console.log('');

    // Get first available club
    const { data: clubs } = await supabase
      .from('clubs')
      .select('id, name')
      .limit(1);

    const clubId = clubs && clubs.length > 0 ? clubs[0].id : null;

    if (!clubId) {
      console.warn('⚠️  Warning: No clubs found in database');
      console.warn('   Profile and athlete record will not be created');
      console.log('');
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║  ✓ User Account Created (No Profile)                  ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('Login Credentials:');
      console.log(`  Email: ${email}`);
      console.log(`  Password: ${password}`);
      return;
    }

    console.log(`Using club: ${clubs[0].name} (${clubId})`);
    console.log('');

    // Create profile
    console.log('Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        email,
        full_name: fullName,
        role: 'athlete',
        club_id: clubId,
        membership_status: 'active',
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      console.warn('   User account was created but profile creation failed');
    } else {
      console.log('✅ Profile created successfully!');
    }

    // Create athlete record
    console.log('Creating athlete record...');
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';

    const { error: athleteError } = await supabase
      .from('athletes')
      .insert({
        user_id: userData.user.id,
        club_id: clubId,
        email,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: '2000-01-01',
        phone_number: '0000000000',
      });

    if (athleteError) {
      console.error('❌ Error creating athlete:', athleteError.message);
      console.warn('   User and profile were created but athlete record creation failed');
    } else {
      console.log('✅ Athlete record created successfully!');
    }

    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✓ User Created Successfully!                         ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Login Credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Send these credentials to the user');
    console.log('  2. User can login at: /login');
    console.log('  3. Recommend user to change password after first login');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createUser();
