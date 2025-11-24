#!/usr/bin/env node

/**
 * ทดสอบระบบ Login และ Storage ใน Supabase
 * รันด้วย: node scripts/test-login-flow.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// อ่าน environment variables จากไฟล์ .env.local
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
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);



async function runTests() {
  console.log('🚀 เริ่มทดสอบระบบ Login และ Storage\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: ทดสอบการ Login
  console.log('📝 Test 1: ทดสอบการ Login');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test-login-1763947958165@example.com',
      password: 'TestPassword123!'
    });

    if (error) throw error;
    
    if (data.user) {
      console.log('✅ Login สำเร็จ');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      results.passed++;
      results.tests.push({ name: 'Login', status: 'PASS' });
    }
  } catch (error) {
    console.log('❌ Login ล้มเหลว:', error.message);
    results.failed++;
    results.tests.push({ name: 'Login', status: 'FAIL', error: error.message });
  }

  // Test 2: ตรวจสอบ Session
  console.log('\n📝 Test 2: ตรวจสอบ Session');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (session) {
      console.log('✅ Session ถูกต้อง');
      console.log(`   Access Token: ${session.access_token.substring(0, 20)}...`);
      results.passed++;
      results.tests.push({ name: 'Session Check', status: 'PASS' });
    } else {
      throw new Error('No active session');
    }
  } catch (error) {
    console.log('❌ Session ไม่ถูกต้อง:', error.message);
    results.failed++;
    results.tests.push({ name: 'Session Check', status: 'FAIL', error: error.message });
  }

  // Test 3: ดึงข้อมูล Profile
  console.log('\n📝 Test 3: ดึงข้อมูล Profile');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    
    if (profile) {
      console.log('✅ ดึงข้อมูล Profile สำเร็จ');
      console.log(`   Name: ${profile.full_name || 'N/A'}`);
      console.log(`   Role: ${profile.role}`);
      results.passed++;
      results.tests.push({ name: 'Profile Fetch', status: 'PASS' });
    }
  } catch (error) {
    console.log('❌ ดึงข้อมูล Profile ล้มเหลว:', error.message);
    results.failed++;
    results.tests.push({ name: 'Profile Fetch', status: 'FAIL', error: error.message });
  }

  // Test 4: ตรวจสอบ Storage Bucket (ใช้วิธีทดสอบโดยการ list files)
  console.log('\n📝 Test 4: ตรวจสอบ Storage Bucket');
  try {
    const { data: files, error } = await supabase.storage
      .from('membership-documents')
      .list();
    
    if (error) throw error;
    
    console.log('✅ Storage Bucket พร้อมใช้งาน');
    console.log(`   Bucket: membership-documents`);
    console.log(`   Files: ${files ? files.length : 0}`);
    results.passed++;
    results.tests.push({ name: 'Storage Bucket', status: 'PASS' });
  } catch (error) {
    console.log('❌ Storage Bucket ไม่พร้อม:', error.message);
    results.failed++;
    results.tests.push({ name: 'Storage Bucket', status: 'FAIL', error: error.message });
  }

  // Test 5: ทดสอบ Upload เอกสาร
  console.log('\n📝 Test 5: ทดสอบ Upload เอกสาร');
  try {
    // สร้างไฟล์ภาพจำลอง (1x1 pixel PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    // ดึง user id
    const { data: { user } } = await supabase.auth.getUser();
    const fileName = `${user.id}/test-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('membership-documents')
      .upload(fileName, pngBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) throw error;
    
    if (data) {
      console.log('✅ Upload เอกสารสำเร็จ');
      console.log(`   Path: ${data.path}`);
      results.passed++;
      results.tests.push({ name: 'Document Upload', status: 'PASS' });
      
      // ลบไฟล์ที่ upload ไปแล้ว
      await supabase.storage
        .from('membership-documents')
        .remove([fileName]);
      console.log('   (ไฟล์ทดสอบถูกลบแล้ว)');
    }
  } catch (error) {
    console.log('❌ Upload เอกสารล้มเหลว:', error.message);
    results.failed++;
    results.tests.push({ name: 'Document Upload', status: 'FAIL', error: error.message });
  }

  // Test 6: ทดสอบ RLS Policies
  console.log('\n📝 Test 6: ทดสอบ RLS Policies');
  try {
    // ลองดึงข้อมูล clubs
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('id, name')
      .limit(5);

    if (error) throw error;
    
    console.log('✅ RLS Policies ทำงานถูกต้อง');
    console.log(`   สามารถดึงข้อมูล ${clubs.length} clubs`);
    results.passed++;
    results.tests.push({ name: 'RLS Policies', status: 'PASS' });
  } catch (error) {
    console.log('❌ RLS Policies มีปัญหา:', error.message);
    results.failed++;
    results.tests.push({ name: 'RLS Policies', status: 'FAIL', error: error.message });
  }

  // Test 7: ทดสอบ Logout
  console.log('\n📝 Test 7: ทดสอบ Logout');
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    console.log('✅ Logout สำเร็จ');
    results.passed++;
    results.tests.push({ name: 'Logout', status: 'PASS' });
  } catch (error) {
    console.log('❌ Logout ล้มเหลว:', error.message);
    results.failed++;
    results.tests.push({ name: 'Logout', status: 'FAIL', error: error.message });
  }

  // สรุปผลการทดสอบ
  console.log('\n' + '='.repeat(50));
  console.log('📊 สรุปผลการทดสอบ');
  console.log('='.repeat(50));
  console.log(`✅ ผ่าน: ${results.passed} tests`);
  console.log(`❌ ไม่ผ่าน: ${results.failed} tests`);
  console.log(`📈 อัตราความสำเร็จ: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 รายละเอียด:');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  process.exit(results.failed > 0 ? 1 : 0);
}

// รันการทดสอบ
runTests().catch(error => {
  console.error('💥 เกิดข้อผิดพลาดร้ายแรง:', error);
  process.exit(1);
});
