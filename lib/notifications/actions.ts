'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_schedule' | 'schedule_reminder' | 'announcement' | 'test_result' | 'leave_approved' | 'leave_rejected';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  session_id?: string;
  announcement_id?: string;
  performance_id?: string;
  leave_request_id?: string;
}

/**
 * Get notifications for current user
 */
export async function getNotifications(limit = 50) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { data: null, error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Notification[], error: null };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { count: 0, error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count || 0, error: null };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athlete');
  return { error: null };
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athlete');
  return { error: null };
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/athlete');
  return { error: null };
}
