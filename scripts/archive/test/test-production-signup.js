#!/usr/bin/env node

/**
 * ทดสอบการสมัครสมาชิกใน Production โดยใช้ Admin API
 * ไม่ถูก rate limit เพราะใช้ service role key
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProductionSignup() {
  console.log('🧪 ทดสอบการสมัครสมาชิกใน Production\n');
  
  const timestamp = Date.now();
  const testEmail = `test-prod-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = `Test User ${timestamp}`;
  
  console.log('📝 ข้อมูลทดสอบ:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log(`   Name: ${testName}\n`);
  
  try {
    // Step 1: สร้าง Auth User (ใช้ Admin API - ไม่ถูก rate limit)
    console.log('1️⃣ สร้าง Auth User...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: testName
      }
    });
    
    if (authError) {
      console.error('❌ สร้าง Auth User ล้มเหลว:', authError.message);
      return false;
    }
    
    console.log('✅ สร้าง Auth User สำเร็จ');
    console.log(`   User ID: ${authUser.user.id}\n`);
    
    // Step 2: ตรวจสอบว่ามี club ในระบบ
    console.log('2️⃣ ตรวจสอบ Clubs...');
    const { data: clubs, error: clubError } = await supabase
      .from('clubs')
      .select('id, name')
      .limit(1);
    
    if (clubError || !clubs || clubs.length === 0) {
      console.error('❌ ไม่พบ Club ในระบบ');
      console.log('💡 กรุณาสร้าง Club ก่อน หรือรัน: ./scripts/run-sql-via-api.sh scripts/03-setup-test-data.sql');
      return false;
    }
    
    const clubId = clubs[0].id;
    console.log('✅ พบ Club:', clubs[0].name);
    console.log(`   Club ID: ${clubId}\n`);
    
    // Step 3: สร้าง Profile
    console.log('3️⃣ สร้าง Profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        full_name: testName,
        role: 'athlete',
        club_id: clubId, // ต้องมี club_id เมื่อ status = active
        membership_status: 'active'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ สร้าง Profile ล้มเหลว:', profileError.message);
      return false;
    }
    
    console.log('✅ สร้าง Profile สำเร็จ\n');
    
    // Step 4: สร้าง Athlete Record
    console.log('4️⃣ สร้าง Athlete Record...');
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .insert({
        user_id: authUser.user.id,
        club_id: clubId,
        email: testEmail,
        first_name: 'Test',
        last_name: `User ${timestamp}`,
        date_of_birth: '2000-01-01',
        phone_number: '0812345678',
        emergency_contact: '0898765432'
      })
      .select()
      .single();
    
    if (athleteError) {
      console.error('❌ สร้าง Athlete Record ล้มเหลว:', athleteError.message);
      return false;
    }
    
    console.log('✅ สร้าง Athlete Record สำเร็จ\n');
    
    // Step 5: ทดสอบ Login
    console.log('5️⃣ ทดสอบ Login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Login ล้มเหลว:', loginError.message);
      return false;
    }
    
    console.log('✅ Login สำเร็จ');
    console.log(`   Session: ${loginData.session ? 'มี' : 'ไม่มี'}\n`);
    
    // Step 6: ทดสอบดึงข้อมูล Profile
    console.log('6️⃣ ทดสอบดึงข้อมูล Profile...');
    const { data: fetchedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();
    
    if (fetchError) {
      console.error('❌ ดึงข้อมูล Profile ล้มเหลว:', fetchError.message);
      return false;
    }
    
    console.log('✅ ดึงข้อมูล Profile สำเร็จ');
    console.log(`   Role: ${fetchedProfile.role}`);
    console.log(`   Status: ${fetchedProfile.membership_status}\n`);
    
    // สรุปผล
    console.log('═══════════════════════════════════════');
    console.log('✅ ทดสอบสำเร็จทั้งหมด!');
    console.log('═══════════════════════════════════════');
    console.log('\n📋 ข้อมูลบัญชีทดสอบ:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   User ID: ${authUser.user.id}`);
    console.log(`   Club ID: ${clubId}`);
    console.log('\n💡 คุณสามารถ login ด้วยบัญชีนี้ได้ที่ production URL');
    console.log('\n🗑️  ลบบัญชีทดสอบ:');
    console.log(`   DELETE FROM auth.users WHERE id = '${authUser.user.id}';`);
    
    return true;
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    return false;
  }
}

// รันการทดสอบ
testProductionSignup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
