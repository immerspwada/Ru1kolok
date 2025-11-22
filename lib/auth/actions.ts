'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export interface AuthResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: 'An error occurred during sign up',
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
      return { success: false, error: authError.message };
    }

    console.log('[signIn] Authentication successful for user:', authData.user.id);

    // Step 2: Record login session with device info
    if (deviceInfo) {
      try {
        // Type assertion needed until TypeScript picks up the new database types
        await (supabase.from('login_sessions') as any).insert({
          user_id: authData.user.id,
          device_id: deviceInfo.deviceId,
          device_info: deviceInfo,
          user_agent: deviceInfo.userAgent,
        });
        console.log('[signIn] Device info recorded:', deviceInfo.deviceId);
      } catch (error) {
        console.error('[signIn] Failed to record device info:', error);
        // Don't fail login if device tracking fails
      }
    }

    type UserRole = 'admin' | 'coach' | 'athlete';
    let role: UserRole = 'athlete';

    // Determine role from email (simple fallback)
    if (email.includes('admin')) {
      role = 'admin';
    } else if (email.includes('coach')) {
      role = 'coach';
    }

    console.log('[signIn] Using email-based role:', role);

    return { success: true, data: { ...authData, role } };
  } catch (error) {
    console.error('[signIn] Unexpected error:', error);
    return {
      success: false,
      error: 'An error occurred during sign in: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
          // Type assertion needed until TypeScript picks up the new database types
          const { data: session } = await (supabase.from('login_sessions') as any)
            .select('id')
            .eq('user_id', user.id)
            .eq('device_id', deviceId)
            .is('logout_at', null)
            .order('login_at', { ascending: false })
            .limit(1)
            .single();

          if (session) {
            // Type assertion needed until TypeScript picks up the new database types
            await (supabase.from('login_sessions') as any)
              .update({ logout_at: new Date().toISOString() })
              .eq('id', session.id);
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
