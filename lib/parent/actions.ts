'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ParentConnection {
  id: string;
  athlete_id: string;
  parent_email: string;
  parent_name: string;
  relationship: 'father' | 'mother' | 'guardian';
  phone_number?: string;
  is_verified: boolean;
  verification_token?: string;
  verification_sent_at?: string;
  verified_at?: string;
  notify_attendance: boolean;
  notify_performance: boolean;
  notify_leave_requests: boolean;
  notify_announcements: boolean;
  notify_goals: boolean;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddParentInput {
  parentEmail: string;
  parentName: string;
  relationship: 'father' | 'mother' | 'guardian';
  phoneNumber?: string;
}

export interface NotificationPreferences {
  notify_attendance?: boolean;
  notify_performance?: boolean;
  notify_leave_requests?: boolean;
  notify_announcements?: boolean;
  notify_goals?: boolean;
  notification_frequency?: 'immediate' | 'daily' | 'weekly';
}

/**
 * เพิ่มผู้ปกครอง
 */
export async function addParentConnection(input: AddParentInput) {
  try {
    const supabase = await createClient();
    
    // Get athlete profile
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
    }
    
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (athleteError || !athlete) {
      return { success: false, error: 'ไม่พบข้อมูลนักกีฬา' };
    }
    
    // Generate verification token
    const verificationToken = crypto.randomUUID();
    
    // Insert parent connection
    const { data, error } = await supabase
      .from('parent_connections')
      .insert({
        athlete_id: athlete.id,
        parent_email: input.parentEmail,
        parent_name: input.parentName,
        relationship: input.relationship,
        phone_number: input.phoneNumber,
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'อีเมลนี้ถูกเพิ่มแล้ว' };
      }
      return { success: false, error: error.message };
    }
    
    // TODO: Send verification email
    // await sendVerificationEmail(input.parentEmail, verificationToken);
    
    revalidatePath('/dashboard/athlete/profile');
    return { 
      success: true, 
      data,
      message: 'เพิ่มผู้ปกครองสำเร็จ กรุณาให้ผู้ปกครองตรวจสอบอีเมลเพื่อยืนยัน'
    };
  } catch (error) {
    console.error('Error adding parent connection:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ปกครอง' };
  }
}

/**
 * ยืนยันอีเมลผู้ปกครอง
 */
export async function verifyParentConnection(token: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('parent_connections')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('verification_token', token)
      .eq('is_verified', false)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: 'ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ' };
    }
    
    return { 
      success: true, 
      data,
      message: 'ยืนยันอีเมลสำเร็จ คุณจะได้รับการแจ้งเตือนเกี่ยวกับบุตรหลานของคุณ'
    };
  } catch (error) {
    console.error('Error verifying parent connection:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการยืนยันอีเมล' };
  }
}

/**
 * ดึงรายการผู้ปกครอง
 */
export async function getParentConnections(): Promise<ParentConnection[]> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('ไม่พบข้อมูลผู้ใช้');
    }
    
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (athleteError || !athlete) {
      throw new Error('ไม่พบข้อมูลนักกีฬา');
    }
    
    const { data, error } = await supabase
      .from('parent_connections')
      .select('*')
      .eq('athlete_id', athlete.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting parent connections:', error);
    return [];
  }
}

/**
 * อัพเดทการตั้งค่าการแจ้งเตือน
 */
export async function updateNotificationPreferences(
  connectionId: string,
  preferences: NotificationPreferences
) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('parent_connections')
      .update(preferences)
      .eq('id', connectionId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/athlete/profile');
    return { 
      success: true, 
      data,
      message: 'อัพเดทการตั้งค่าสำเร็จ'
    };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า' };
  }
}

/**
 * ส่งอีเมลยืนยันใหม่
 */
export async function resendVerificationEmail(connectionId: string) {
  try {
    const supabase = await createClient();
    
    // Generate new token
    const verificationToken = crypto.randomUUID();
    
    const { data, error } = await supabase
      .from('parent_connections')
      .update({
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .eq('is_verified', false)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: 'ไม่สามารถส่งอีเมลยืนยันได้' };
    }
    
    // TODO: Send verification email
    // await sendVerificationEmail(data.parent_email, verificationToken);
    
    return { 
      success: true,
      message: 'ส่งอีเมลยืนยันใหม่สำเร็จ'
    };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการส่งอีเมล' };
  }
}

/**
 * ลบผู้ปกครอง
 */
export async function removeParentConnection(connectionId: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('parent_connections')
      .delete()
      .eq('id', connectionId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/athlete/profile');
    return { 
      success: true,
      message: 'ลบผู้ปกครองสำเร็จ'
    };
  } catch (error) {
    console.error('Error removing parent connection:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบผู้ปกครอง' };
  }
}

/**
 * ดึงสถิติการแจ้งเตือน (สำหรับโค้ช/แอดมิน)
 */
export async function getParentNotificationStats(athleteId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('parent_notifications')
      .select('type, delivery_status')
      .eq('athlete_id', athleteId);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      sent: data.filter(n => n.delivery_status === 'sent').length,
      pending: data.filter(n => n.delivery_status === 'pending').length,
      failed: data.filter(n => n.delivery_status === 'failed').length,
      byType: {
        attendance: data.filter(n => n.type === 'attendance').length,
        performance: data.filter(n => n.type === 'performance').length,
        leave: data.filter(n => n.type === 'leave').length,
        announcement: data.filter(n => n.type === 'announcement').length,
        goal: data.filter(n => n.type === 'goal').length,
        report: data.filter(n => n.type === 'report').length,
      }
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการดึงสถิติ' };
  }
}
