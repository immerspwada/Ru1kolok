#!/usr/bin/env node

/**
 * สร้างบัญชี Demo ทั้ง 3 ระดับผ่าน Admin API
 * วิธีนี้จะสร้าง password ที่ใช้งานได้จริง
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

// ใช้ service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEMO_USERS = [
  {
    email: 'demo.admin@test.com',
    password: 'demo1234',
    full_name: 'Admin Demo',
    role: 'admin',
  },
  {
    email: 'demo.coach@test.com',
    password: 'demo1234',
    full_name: 'Coach Demo',
    role: 'coach',
  },
  {
    email: 'demo.athlete@test.com',
    password: 'demo1234',
    full_name: 'Athlete Demo',
    role: 'athlete',
  },
];

async function createDemoUsers() {
  console.log('🚀 สร้างบัญชี Demo ทั้ง 3 ระดับ\n');

  // ลบ users เก่าทั้งหมด
  console.log('🗑️  ลบบัญชีเก่า...');
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  
  for (const user of DEMO_USERS) {
    const existing = existingUsers.users.find(u => u.email === user.email);
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
      console.log(`   ลบ: ${user.email}`);
    }
  }

  // หา club
  const { data: clubs } = await supabase.from('clubs').select('id').limit(1);
  const clubId = clubs && clubs.length > 0 ? clubs[0].id : null;

  if (!clubId) {
    console.error('❌ ไม่พบ club ในระบบ กรุณาสร้าง club ก่อน');
    process.exit(1);
  }

  console.log('\n✨ สร้างบัญชีใหม่...\n');

  const createdUsers = [];

  for (const user of DEMO_USERS) {
    try {
      // สร้าง user ผ่าน Admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
        },
      });

      if (createError) throw createError;

      console.log(`✅ สร้าง ${user.role}: ${user.email}`);
      console.log(`   User ID: ${newUser.user.id}`);

      // สร้าง profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          club_id: clubId,
          membership_status: 'active',
        });

      if (profileError) {
        console.log(`   ⚠️  Profile: ${profileError.message}`);
      } else {
        console.log(`   ✓ Profile created`);
      }

      // สร้าง user_roles สำหรับทุก role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: newUser.user.id,
        role: user.role,
      });

      if (roleError) {
        console.log(`   ⚠️  User Role: ${roleError.message}`);
      } else {
        console.log(`   ✓ User role assigned: ${user.role}`);
      }

      // สร้าง coaches record
      if (user.role === 'coach') {
        const { error: coachError } = await supabase.from('coaches').insert({
          user_id: newUser.user.id,
          club_id: clubId,
          first_name: 'Coach',
          last_name: 'Demo',
          email: user.email,
          phone_number: '0812345678',
          specialization: 'ฟุตบอล',
        });
        
        if (coachError) {
          console.log(`   ⚠️  Coach record: ${coachError.message}`);
        } else {
          console.log(`   ✓ Coach record created`);
        }
      }

      // สร้าง athletes record
      if (user.role === 'athlete') {
        const { error: athleteError } = await supabase.from('athletes').insert({
          user_id: newUser.user.id,
          club_id: clubId,
          email: user.email,
          first_name: 'Athlete',
          last_name: 'Demo',
          date_of_birth: '2000-01-01',
          phone_number: '0898765432',
        });
        
        if (athleteError) {
          console.log(`   ⚠️  Athlete record: ${athleteError.message}`);
        } else {
          console.log(`   ✓ Athlete record created`);
        }
      }

      createdUsers.push({
        email: user.email,
        password: user.password,
        role: user.role,
        id: newUser.user.id,
      });

    } catch (error) {
      console.log(`❌ Error creating ${user.role}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 สร้างบัญชีเสร็จสมบูรณ์!');
  console.log('='.repeat(50));
  console.log('\n📋 บัญชีทดสอบ:\n');

  createdUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.role.toUpperCase()}`);
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🔑 Password: ${user.password}`);
    console.log('');
  });

  console.log('💡 ลอง login ที่: http://localhost:3000/login');
  console.log('');
}

createDemoUsers();
