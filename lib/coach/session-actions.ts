'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/audit/actions';
import { Database } from '@/types/database.types';
import { invalidatePattern } from '@/lib/utils/cache';

type TrainingSession = Database['public']['Tables']['training_sessions']['Row'];
type TrainingSessionInsert = Database['public']['Tables']['training_sessions']['Insert'];
type TrainingSessionUpdate = Database['public']['Tables']['training_sessions']['Update'];
type Coach = Database['public']['Tables']['coaches']['Row'];

/**
 * Create a new training session
 */
export async function createSession(data: {
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
}): Promise<{ success?: boolean; data?: TrainingSession; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (coachError || !coach) {
      return { error: 'ไม่พบข้อมูลโค้ช' };
    }

    // Validate input
    if (!data.title || data.title.trim().length === 0) {
      return { error: 'กรุณากรอกชื่อตารางฝึกซ้อม' };
    }

    if (!data.location || data.location.trim().length === 0) {
      return { error: 'กรุณากรอกสถานที่' };
    }

    // Validate date is not in the past
    const sessionDate = new Date(data.session_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (sessionDate < today) {
      return { error: 'ไม่สามารถสร้างตารางในอดีตได้' };
    }

    // Validate start_time < end_time
    if (data.start_time >= data.end_time) {
      return { error: 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด' };
    }

    // Create session
    const coachData = coach as Coach;
    const sessionData: TrainingSessionInsert = {
      club_id: coachData.club_id,
      coach_id: coachData.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      session_date: data.session_date,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location.trim(),
    };

    // Type assertion needed until TypeScript picks up the new database types
    const { data: session, error: insertError } = await (supabase
      .from('training_sessions') as any)
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return { error: 'เกิดข้อผิดพลาดในการสร้างตารางฝึกซ้อม' };
    }

    // Log audit event
    await createAuditLog({
      userId: user.id,
      actionType: 'training_session.create',
      entityType: 'training_session',
      // @ts-ignore
      entityId: session.id,
      details: sessionData,
    });

    revalidatePath('/dashboard/coach/sessions');

    // Invalidate stats cache
    invalidatePattern('attendance-stats:.*');
    invalidatePattern('club-stats:.*');

    return { success: true, data: session };
  } catch (error) {
    console.error('Unexpected error in createSession:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Update an existing training session
 */
export async function updateSession(
  sessionId: string,
  data: {
    title?: string;
    description?: string;
    session_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
  }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (coachError || !coach) {
      return { error: 'ไม่พบข้อมูลโค้ช' };
    }

    // Verify session belongs to coach
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { error: 'ไม่พบตารางฝึกซ้อม' };
    }

    // @ts-ignore
    if (session.coach_id !== coach.id) {
      return { error: 'ไม่ได้รับอนุญาต: คุณไม่สามารถแก้ไขตารางของโค้ชอื่นได้' };
    }

    // Validate input
    if (data.title !== undefined && data.title.trim().length === 0) {
      return { error: 'ชื่อตารางฝึกซ้อมต้องไม่ว่าง' };
    }

    if (data.location !== undefined && data.location.trim().length === 0) {
      return { error: 'สถานที่ต้องไม่ว่าง' };
    }

    // Validate date is not in the past
    if (data.session_date) {
      const sessionDate = new Date(data.session_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (sessionDate < today) {
        return { error: 'ไม่สามารถกำหนดวันในอดีตได้' };
      }
    }

    // Validate start_time < end_time
    // @ts-ignore
    const startTime = data.start_time || session.start_time;
    // @ts-ignore
    const endTime = data.end_time || session.end_time;
    
    if (startTime >= endTime) {
      return { error: 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด' };
    }

    // Prepare update data
    const updateData: TrainingSessionUpdate = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim() || null;
    if (data.session_date !== undefined) updateData.session_date = data.session_date;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.location !== undefined) updateData.location = data.location.trim();

    // Update session
    // @ts-ignore - Supabase type inference issue
    // Type assertion needed until TypeScript picks up the new database types
    const { error: updateError } = await (supabase
      .from('training_sessions') as any)
      .update(updateData)
      .eq('id', sessionId);

    if (updateError) {
      console.error('Update error:', updateError);
      return { error: 'เกิดข้อผิดพลาดในการแก้ไขตารางฝึกซ้อม' };
    }

    // Log audit event
    await createAuditLog({
      userId: user.id,
      actionType: 'training_session.update',
      entityType: 'training_session',
      entityId: sessionId,
      details: updateData,
    });

    revalidatePath('/dashboard/coach/sessions');
    revalidatePath(`/dashboard/coach/sessions/${sessionId}`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateSession:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Cancel a training session
 * Can only cancel if at least 2 hours before start time
 */
export async function cancelSession(sessionId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (coachError || !coach) {
      return { error: 'ไม่พบข้อมูลโค้ช' };
    }

    // Verify session belongs to coach
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { error: 'ไม่พบตารางฝึกซ้อม' };
    }

    // @ts-ignore
    if (session.coach_id !== coach.id) {
      return { error: 'ไม่ได้รับอนุญาต: คุณไม่สามารถยกเลิกตารางของโค้ชอื่นได้' };
    }

    // Check if session is at least 2 hours in the future
    // @ts-ignore
    const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (sessionDateTime < twoHoursFromNow) {
      return { error: 'ไม่สามารถยกเลิกตารางได้ ต้องยกเลิกก่อนเวลาเริ่มอย่างน้อย 2 ชั่วโมง' };
    }

    // Delete session (soft delete by updating status would be better in production)
    const { error: deleteError } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { error: 'เกิดข้อผิดพลาดในการยกเลิกตารางฝึกซ้อม' };
    }

    // Log audit event
    await createAuditLog({
      userId: user.id,
      actionType: 'training_session.delete',
      entityType: 'training_session',
      entityId: sessionId,
      details: { cancelled_at: new Date().toISOString() },
    });

    revalidatePath('/dashboard/coach/sessions');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in cancelSession:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get all training sessions for a coach
 * OPTIMIZED: Added pagination support
 */
export async function getCoachSessions(filter?: {
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ data?: TrainingSession[]; total?: number; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Get coach profile
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (coachError || !coach) {
      return { error: 'ไม่พบข้อมูลโค้ช' };
    }

    // Build query with pagination
    const limit = filter?.limit || 100; // Default limit
    const offset = filter?.offset || 0;

    // @ts-ignore
    let query = supabase
      .from('training_sessions')
      .select('*', { count: 'exact' })
      // @ts-ignore
      .eq('coach_id', coach.id)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    const today = new Date().toISOString().split('T')[0];
    
    if (filter?.upcoming) {
      query = query.gte('session_date', today);
    } else if (filter?.past) {
      query = query.lt('session_date', today);
    }

    const { data: sessions, error: sessionsError, count } = await query;

    if (sessionsError) {
      console.error('Query error:', sessionsError);
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลตารางฝึกซ้อม' };
    }

    return { data: sessions, total: count || 0 };
  } catch (error) {
    console.error('Unexpected error in getCoachSessions:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get a single training session with details
 */
export async function getSessionDetails(sessionId: string): Promise<{
  data?: TrainingSession & { attendance_count?: number };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { error: 'ไม่พบตารางฝึกซ้อม' };
    }

    // Get attendance count
    const { count, error: countError } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('training_session_id', sessionId)
      .eq('status', 'present');

    if (countError) {
      console.error('Count error:', countError);
    }

    return {
      data: {
        // @ts-ignore
        ...session,
        attendance_count: count || 0,
      },
    };
  } catch (error) {
    console.error('Unexpected error in getSessionDetails:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}
