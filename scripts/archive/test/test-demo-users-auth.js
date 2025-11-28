#!/usr/bin/env node

/**
 * ทดสอบการ Login ของบัญชี Demo ทั้ง 3
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
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USERS = [
  { email: 'demo.admin@test.com', password: 'demo1234', role: 'Admin' },
  { email: 'demo.coach@test.com', password: 'demo1234', role: 'Coach' },
  { email: 'demo.athlete@test.com', password: 'demo1234', role: 'Athlete' },
];

async function testLogin(email, password, role) {
  console.log(`\n🧪 ทดสอบ ${role}: ${email}`);
  console.log('─'.repeat(50));

  try {
    // ลอง login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`❌ Login ล้มเหลว: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (data.user) {
      console.log(`✅ Login สำเร็จ!`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

      // ดึงข้อมูล profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.log(`   ⚠️  Profile Error: ${profileError.message}`);
      } else if (profile) {
        console.log(`   Profile: ${profile.full_name} (${profile.role})`);
      }

      // Logout
      await supabase.auth.signOut();

      return { success: true };
    }

    return { success: false, error: 'No user data returned' };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 ทดสอบการ Login บัญชี Demo ทั้ง 3');
  console.log('='.repeat(50));

  const results = [];

  for (const user of TEST_USERS) {
    const result = await testLogin(user.email, user.password, user.role);
    results.push({
      role: user.role,
      email: user.email,
      ...result,
    });
  }

  // สรุปผล
  console.log('\n' + '='.repeat(50));
  console.log('📊 สรุปผลการทดสอบ');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.role} (${result.email})`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
  console.log(`✅ ผ่าน: ${passed}/3`);
  console.log(`❌ ไม่ผ่าน: ${failed}/3`);

  if (failed > 0) {
    console.log('\n⚠️  มีบัญชีที่ login ไม่ได้!');
    console.log('💡 แนะนำ: ลองสร้างบัญชีใหม่ด้วย Admin API');
    console.log('   node scripts/create-test-user-via-api.js');
    process.exit(1);
  } else {
    console.log('\n🎉 บัญชีทั้งหมดทำงานได้ดี!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('💥 เกิดข้อผิดพลาด:', error);
  process.exit(1);
});
