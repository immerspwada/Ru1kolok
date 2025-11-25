'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export interface AuthResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function signUp(email: string, password: string): Promise<AuthResult & { userId?: string }> {
  try {
    const supabase = await createClient();

    // Step 1: Create auth account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      // Log the actual error for debugging
      console.error('[signUp] Supabase error:', error.message, error);
      
      // Translate common Supabase errors to Thai
      // Check in order of specificity
      let errorMessage = 'เกิดข้อผิดพลาดในการสร้างบัญชี กรุณาลองใหม่อีกครั้ง';
      
      const errorLower = error.message.toLowerCase();
      
      // Rate limit errors (check first as they're most specific)
      if (errorLower.includes('rate limit') || 
          errorLower.includes('too many')) {
        errorMessage = 'ลองสมัครบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (1-2 นาที)';
      } 
      // Duplicate email (check before generic "already" checks)
      else if (errorLower.includes('already registered') || 
               errorLower.includes('already been registered')) {
        errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น';
      } 
      // Invalid email format (check for "invalid" AND "email")
      else if (errorLower.includes('invalid') && errorLower.includes('email')) {
        errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง กรุณาใช้อีเมลจริง (เช่น example@gmail.com)';
      } 
      // Password errors (check for "password" in message)
      else if (errorLower.includes('password')) {
        errorMessage = 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      }
      
      return { success: false, error: errorMessage };
    }

    if (!data.user) {
      return { success: false, error: 'ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง' };
    }

    // Step 2: Create basic profile (membership_status = null until they apply)
    // Note: Profile and role creation failures are logged but don't fail the signup
    // This ensures the auth account is created even if secondary operations fail
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: data.user.id,
      full_name: email.split('@')[0], // Use email prefix as temporary name
      membership_status: null as null, // Not yet applied for membership
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    if (profileError) {
      console.error('[signUp] Failed to create profile:', profileError);
      // Don't fail signup if profile creation fails - it can be created later
    }

    // Step 3: Create user role (default: athlete)
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: data.user.id,
      role: 'athlete' as const, // Default role for new signups
    } as any);

    if (roleError) {
      console.error('[signUp] Failed to create user role:', roleError);
      // Don't fail signup if role creation fails - it can be created later
    }

    return { success: true, userId: data.user.id };
  } catch (error) {
    console.error('[signUp] Unexpected error:', error);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้างบัญชี กรุณาลองใหม่อีกครั้ง',
    };
  }
}

export async function signIn(
  email: string,
  password: string,
  deviceInfo?: {
    deviceId: string;
    userAgent?: string;
    platform?: string;
    language?: string;
    screenResolution?: string;
    timezone?: string;
  }
): Promise<AuthResult> {
  try {
    console.log('[signIn] Starting authentication for:', email);
    const supabase = await createClient();

    // Step 1: Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('[signIn] Auth error:', authError);
      
      // Translate common auth errors to Thai
      // Generic error message that doesn't reveal which field is incorrect (Requirement 3.4)
      let errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      
      const errorLower = authError.message.toLowerCase();
      
      // Check for specific error types
      if (errorLower.includes('rate limit') || errorLower.includes('too many')) {
        errorMessage = 'ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
      } else if (errorLower.includes('email not confirmed')) {
        errorMessage = 'กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ';
      } else if (errorLower.includes('network') || errorLower.includes('connection')) {
        errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
      }
      
      return { success: false, error: errorMessage };
    }

    console.log('[signIn] Authentication successful for user:', authData.user.id);

    // Step 2: Record login session with device info
    if (deviceInfo) {
      try {
        await supabase.from('login_sessions').insert({
          user_id: authData.user.id,
          device_id: deviceInfo.deviceId,
          device_info: deviceInfo as any,
          user_agent: deviceInfo.userAgent,
          login_at: new Date().toISOString(),
        } as any);
        console.log('[signIn] Device info recorded:', deviceInfo.deviceId);
      } catch (error) {
        console.error('[signIn] Failed to record device info:', error);
        // Don't fail login if device tracking fails
      }
    }

    // Return success - middleware will handle role-based routing
    return { success: true, data: authData };
  } catch (error) {
    console.error('[signIn] Unexpected error:', error);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง',
    };
  }
}

export async function signOut(deviceId?: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Record logout time if device ID is provided
    if (deviceId) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: session } = await supabase
            .from('login_sessions')
            .select('id')
            .eq('user_id', user.id)
            .eq('device_id', deviceId)
            .is('logout_at', null)
            .order('login_at', { ascending: false })
            .limit(1)
            .single();

          if (session) {
            const updateData: any = { logout_at: new Date().toISOString() };
            await (supabase.from('login_sessions') as any)
              .update(updateData)
              .eq('id', (session as any).id);
          }
        }
      } catch (error) {
        console.error('[signOut] Failed to record logout:', error);
        // Don't fail logout if device tracking fails
      }
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    redirect('/login');
  } catch {
    return {
      success: false,
      error: 'An error occurred during sign out',
    };
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    type UserRole = 'admin' | 'coach' | 'athlete';
    const role: UserRole = (roleData as { role: UserRole } | null)?.role || 'athlete';

    return {
      ...user,
      role,
    };
  } catch {
    return null;
  }
}

export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    type UserRole = 'admin' | 'coach' | 'athlete';
    return (data as { role: UserRole }).role;
  } catch {
    return null;
  }
}

export async function verifyOTP(email: string, token: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: 'An error occurred during OTP verification',
    };
  }
}

export async function resendOTP(email: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'An error occurred while resending OTP',
    };
  }
}

export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'An error occurred during password reset',
    };
  }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'An error occurred during password update',
    };
  }
}

export interface LoginSession {
  id: string;
  user_id: string;
  device_id: string;
  device_info: {
    deviceId: string;
    userAgent?: string;
    platform?: string;
    language?: string;
    screenResolution?: string;
    timezone?: string;
  };
  user_agent: string | null;
  login_at: string;
  logout_at: string | null;
  created_at: string;
}

/**
 * Get login history for the current user
 * Returns all login sessions with device information
 * Requirement 6.3: Display all login sessions with device information
 */
export async function getLoginHistory(limit = 50): Promise<AuthResult & { sessions?: LoginSession[] }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
    }

    // Get login sessions for this user
    const { data, error } = await supabase
      .from('login_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('login_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getLoginHistory] Error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูลประวัติการเข้าสู่ระบบได้' };
    }

    return { success: true, sessions: data as LoginSession[] };
  } catch (error) {
    console.error('[getLoginHistory] Unexpected error:', error);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการเข้าสู่ระบบ',
    };
  }
}

/**
 * Get active sessions for the current user
 * Returns sessions that haven't been logged out yet
 * Requirement 6.4: Track each device separately
 */
export async function getActiveSessions(): Promise<AuthResult & { sessions?: LoginSession[] }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
    }

    // Get active sessions (where logout_at is null)
    const { data, error } = await supabase
      .from('login_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('logout_at', null)
      .order('login_at', { ascending: false });

    if (error) {
      console.error('[getActiveSessions] Error:', error);
      return { success: false, error: 'ไม่สามารถดึงข้อมูล session ที่ใช้งานอยู่ได้' };
    }

    return { success: true, sessions: data as LoginSession[] };
  } catch (error) {
    console.error('[getActiveSessions] Unexpected error:', error);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล session ที่ใช้งานอยู่',
    };
  }
}
