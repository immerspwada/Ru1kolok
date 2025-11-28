#!/usr/bin/env node

/**
 * สร้าง Test User ผ่าน Supabase Admin API
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// อ่าน environment variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// ใช้ service role key เพื่อสร้าง user
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🚀 สร้าง Test User สำหรับทดสอบ Login\n');

  const testEmail = `test-login-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // ลบ user เก่าถ้ามี
    console.log('📝 ตรวจสอบ user เก่า...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === testEmail);
    
    if (existingUser) {
      console.log('🗑️  ลบ user เก่า...');
      await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // สร้าง user ใหม่
    console.log('✨ สร้าง user ใหม่...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Login User'
      }
    });

    if (createError) throw createError;

    console.log('✅ สร้าง user สำเร็จ!');
    console.log(`   User ID: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}`);

    // สร้าง profile
    console.log('\n📝 สร้าง profile...');
    
    // หา club
    const { data: clubs } = await supabase
      .from('clubs')
      .select('id')
      .limit(1);

    const clubId = clubs && clubs.length > 0 ? clubs[0].id : null;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: testEmail,
        full_name: 'Test Login User',
        role: 'athlete',
        club_id: clubId,
        membership_status: 'active'
      });

    if (profileError) {
      console.log('⚠️  Profile error:', profileError.message);
    } else {
      console.log('✅ สร้าง profile สำเร็จ!');
    }

    // สร้าง athlete record
    if (clubId) {
      console.log('\n📝 สร้าง athlete record...');
      const { error: athleteError } = await supabase
        .from('athletes')
        .insert({
          user_id: newUser.user.id,
          club_id: clubId,
          email: testEmail,
          first_name: 'Test',
          last_name: 'Login User',
          date_of_birth: '2000-01-01',
          phone_number: '0812345678'
        });

      if (athleteError) {
        console.log('⚠️  Athlete error:', athleteError.message);
      } else {
        console.log('✅ สร้าง athlete record สำเร็จ!');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Setup เสร็จสมบูรณ์!');
    console.log('='.repeat(50));
    console.log('\n📋 ข้อมูลสำหรับ Login:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n💡 ใช้คำสั่ง: node scripts/test-login-flow.js');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  }
}

createTestUser();
