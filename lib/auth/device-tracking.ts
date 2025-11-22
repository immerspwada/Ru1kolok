'use server';

import { createClient } from '@/lib/supabase/server';

export interface DeviceInfo {
  deviceId: string;
  userAgent?: string;
  platform?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
}

/**
 * Record a login session with device information
 */
export async function recordLoginSession(
  userId: string,
  deviceInfo: DeviceInfo,
  ipAddress?: string
) {
  try {
    const supabase = await createClient();

    // Type assertion needed until TypeScript picks up the new database types
    const { error } = await (supabase.from('login_sessions') as any).insert({
      user_id: userId,
      device_id: deviceInfo.deviceId,
      device_info: deviceInfo,
      ip_address: ipAddress,
      user_agent: deviceInfo.userAgent,
    });

    if (error) {
      console.error('[recordLoginSession] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[recordLoginSession] Unexpected error:', error);
    return { success: false, error: 'Failed to record login session' };
  }
}

/**
 * Update logout time for a session
 */
export async function recordLogoutSession(userId: string, deviceId: string) {
  try {
    const supabase = await createClient();

    // Find the most recent active session for this user and device
    // Type assertion needed until TypeScript picks up the new database types
    const { data: session } = await (supabase.from('login_sessions') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .is('logout_at', null)
      .order('login_at', { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      return { success: false, error: 'No active session found' };
    }

    // Type assertion needed until TypeScript picks up the new database types
    const { error } = await (supabase.from('login_sessions') as any)
      .update({ logout_at: new Date().toISOString() })
      .eq('id', session.id);

    if (error) {
      console.error('[recordLogoutSession] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[recordLogoutSession] Unexpected error:', error);
    return { success: false, error: 'Failed to record logout' };
  }
}

/**
 * Get device statistics for a user
 */
export async function getDeviceStatistics(userId?: string) {
  try {
    const supabase = await createClient();

    // Type assertion needed until TypeScript picks up the new database types
    const { data, error } = await (supabase.rpc as any)('get_device_statistics', {
      p_user_id: userId || null,
    });

    if (error) {
      console.error('[getDeviceStatistics] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[getDeviceStatistics] Unexpected error:', error);
    return { success: false, error: 'Failed to get device statistics' };
  }
}

/**
 * Get recent login sessions for a user
 */
export async function getRecentLoginSessions(userId: string, limit = 10) {
  try {
    const supabase = await createClient();

    // Type assertion needed until TypeScript picks up the new database types
    const { data, error } = await (supabase.from('login_sessions') as any)
      .select('*')
      .eq('user_id', userId)
      .order('login_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getRecentLoginSessions] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[getRecentLoginSessions] Unexpected error:', error);
    return { success: false, error: 'Failed to get login sessions' };
  }
}
