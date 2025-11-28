'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const PARENT_SESSION_COOKIE = 'parent_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface ParentUser {
  id: string;
  email: string;
  last_login_at?: string;
  login_count: number;
}

/**
 * ยืนยันอีเมลและตั้งรหัสผ่าน
 */
export async function verifyAndSetPassword(token: string, password: string) {
  try {
    const supabase = await createClient();
    
    // Validation
    if (!password || password.length < 6) {
      return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
    }
    
    // ตรวจสอบ token
    const { data: connection, error: connError } = await supabase
      .from('parent_connections')
      .select('*')
      .eq('verification_token', token)
      .eq('is_verified', false)
      .single();
    
    if (connError || !connection) {
      return { success: false, error: 'ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ' };
    }
    
    // ตรวจสอบว่าหมดอายุหรือไม่ (7 วัน)
    const sentAt = new Date(connection.verification_sent_at);
    const now = new Date();
    const daysDiff = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      return { success: false, error: 'ลิงก์ยืนยันหมดอายุแล้ว กรุณาขอลิงก์ใหม่' };
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // สร้าง parent_user
    const { data: parentUser, error: userError } = await supabase
      .from('parent_users')
      .insert({
        email: connection.parent_email,
        password_hash: passwordHash,
      })
      .select()
      .single();
    
    if (userError) {
      if (userError.code === '23505') {
        return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
      }
      return { success: false, error: userError.message };
    }
    
    // อัพเดท parent_connections
    await supabase
      .from('parent_connections')
      .update({
        parent_user_id: parentUser.id,
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('id', connection.id);
    
    // สร้าง session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await supabase
      .from('parent_sessions')
      .insert({
        parent_user_id: parentUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });
    
    // Set cookie
    (await cookies()).set(PARENT_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/parent',
    });
    
    return { 
      success: true, 
      message: 'ยืนยันอีเมลและสร้างบัญชีสำเร็จ',
      user: {
        id: parentUser.id,
        email: parentUser.email,
      }
    };
  } catch (error) {
    console.error('Error verifying and setting password:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการสร้างบัญชี' };
  }
}

/**
 * ล็อกอิน
 */
export async function parentLogin(email: string, password: string) {
  try {
    const supabase = await createClient();
    
    // Validation
    if (!email || !password) {
      return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
    }
    
    // ดึงข้อมูล parent_user
    const { data: parentUser, error: userError } = await supabase
      .from('parent_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (userError || !parentUser) {
      return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    
    // ตรวจสอบว่า account ถูก lock หรือไม่
    if (parentUser.locked_until) {
      const lockedUntil = new Date(parentUser.locked_until);
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / (1000 * 60));
        return { 
          success: false, 
          error: `บัญชีถูกล็อก กรุณารอ ${minutesLeft} นาที` 
        };
      }
    }
    
    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, parentUser.password_hash);
    
    if (!isPasswordValid) {
      // เพิ่มจำนวนครั้งที่ล็อกอินผิด
      const failedAttempts = (parentUser.failed_login_attempts || 0) + 1;
      const updates: any = { failed_login_attempts: failedAttempts };
      
      // Lock account ถ้าล็อกอินผิด 5 ครั้ง
      if (failedAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 นาที
      }
      
      await supabase
        .from('parent_users')
        .update(updates)
        .eq('id', parentUser.id);
      
      return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    
    // ล็อกอินสำเร็จ - รีเซ็ตจำนวนครั้งที่ล็อกอินผิด
    await supabase
      .from('parent_users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        login_count: (parentUser.login_count || 0) + 1,
      })
      .eq('id', parentUser.id);
    
    // สร้าง session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await supabase
      .from('parent_sessions')
      .insert({
        parent_user_id: parentUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });
    
    // Set cookie
    (await cookies()).set(PARENT_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/parent',
    });
    
    return { 
      success: true, 
      message: 'ล็อกอินสำเร็จ',
      user: {
        id: parentUser.id,
        email: parentUser.email,
      }
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการล็อกอิน' };
  }
}

/**
 * ล็อกเอาท์
 */
export async function parentLogout() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARENT_SESSION_COOKIE)?.value;
    
    if (sessionToken) {
      const supabase = await createClient();
      
      // ลบ session
      await supabase
        .from('parent_sessions')
        .delete()
        .eq('session_token', sessionToken);
    }
    
    // ลบ cookie
    cookieStore.delete(PARENT_SESSION_COOKIE);
    
    return { success: true, message: 'ล็อกเอาท์สำเร็จ' };
  } catch (error) {
    console.error('Error logging out:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการล็อกเอาท์' };
  }
}

/**
 * ตรวจสอบ session
 */
export async function getParentSession(): Promise<ParentUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(PARENT_SESSION_COOKIE)?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const supabase = await createClient();
    
    // ดึงข้อมูล session
    const { data: session, error: sessionError } = await supabase
      .from('parent_sessions')
      .select('*, parent_users(*)')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (sessionError || !session) {
      // Session หมดอายุ - ลบ cookie
      cookieStore.delete(PARENT_SESSION_COOKIE);
      return null;
    }
    
    // อัพเดท last_activity_at
    await supabase
      .from('parent_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', session.id);
    
    return {
      id: session.parent_users.id,
      email: session.parent_users.email,
      last_login_at: session.parent_users.last_login_at,
      login_count: session.parent_users.login_count,
    };
  } catch (error) {
    console.error('Error getting parent session:', error);
    return null;
  }
}

/**
 * เปลี่ยนรหัสผ่าน
 */
export async function changeParentPassword(oldPassword: string, newPassword: string) {
  try {
    const parentUser = await getParentSession();
    if (!parentUser) {
      return { success: false, error: 'กรุณาล็อกอินก่อน' };
    }
    
    // Validation
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' };
    }
    
    const supabase = await createClient();
    
    // ดึงข้อมูล parent_user
    const { data: user, error: userError } = await supabase
      .from('parent_users')
      .select('password_hash')
      .eq('id', parentUser.id)
      .single();
    
    if (userError || !user) {
      return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
    }
    
    // ตรวจสอบรหัสผ่านเดิม
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      return { success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' };
    }
    
    // Hash รหัสผ่านใหม่
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // อัพเดทรหัสผ่าน
    await supabase
      .from('parent_users')
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', parentUser.id);
    
    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' };
  }
}

/**
 * ขอรีเซ็ตรหัสผ่าน
 */
export async function requestPasswordReset(email: string) {
  try {
    const supabase = await createClient();
    
    // ตรวจสอบว่ามี parent_user หรือไม่
    const { data: parentUser, error: userError } = await supabase
      .from('parent_users')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    // ไม่แจ้งว่าไม่พบอีเมล (security)
    if (userError || !parentUser) {
      return { 
        success: true, 
        message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้' 
      };
    }
    
    // สร้าง reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ชั่วโมง
    
    await supabase
      .from('parent_password_resets')
      .insert({
        parent_user_id: parentUser.id,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
      });
    
    // TODO: ส่งอีเมล
    // await sendPasswordResetEmail(email, resetToken);
    
    return { 
      success: true, 
      message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้',
      resetToken, // TODO: ลบออกใน production
    };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return { success: false, error: 'เกิดข้อผิดพลาด' };
  }
}

/**
 * รีเซ็ตรหัสผ่าน
 */
export async function resetPassword(token: string, newPassword: string) {
  try {
    const supabase = await createClient();
    
    // Validation
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
    }
    
    // ตรวจสอบ token
    const { data: reset, error: resetError } = await supabase
      .from('parent_password_resets')
      .select('*')
      .eq('reset_token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (resetError || !reset) {
      return { success: false, error: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ' };
    }
    
    // Hash รหัสผ่านใหม่
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // อัพเดทรหัสผ่าน
    await supabase
      .from('parent_users')
      .update({
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', reset.parent_user_id);
    
    // ทำเครื่องหมายว่าใช้ token แล้ว
    await supabase
      .from('parent_password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('id', reset.id);
    
    // ลบ sessions ทั้งหมด
    await supabase
      .from('parent_sessions')
      .delete()
      .eq('parent_user_id', reset.parent_user_id);
    
    return { success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาล็อกอินด้วยรหัสผ่านใหม่' };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' };
  }
}
