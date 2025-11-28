'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateFeedbackInput {
  training_log_id: string;
  feedback_text: string;
  rating?: number;
  improvement_areas?: string[];
  next_steps?: string;
}

export async function getPendingHomeTrainingReviews() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'coach') {
    return { error: 'เฉพาะโค้ชเท่านั้นที่สามารถดูรายการนี้ได้' };
  }

  const { data, error } = await supabase.rpc('get_coach_pending_home_training_reviews', {
    p_coach_id: profile.id,
  });

  if (error) {
    console.error('Error fetching pending reviews:', error);
    return { error: 'ไม่สามารถดึงข้อมูลการฝึกที่รอตรวจได้' };
  }

  return { data };
}

export async function getClubHomeTrainingLogs(filters?: {
  status?: string;
  athlete_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, club_id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'coach') {
    return { error: 'เฉพาะโค้ชเท่านั้นที่สามารถดูรายการนี้ได้' };
  }

  let query = supabase
    .from('home_training_logs')
    .select(`
      *,
      athlete:profiles!home_training_logs_athlete_id_fkey(id, full_name, profile_picture_url),
      reviewer:profiles!home_training_logs_reviewed_by_fkey(full_name)
    `)
    .eq('club_id', profile.club_id);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.athlete_id) {
    query = query.eq('athlete_id', filters.athlete_id);
  }

  if (filters?.start_date) {
    query = query.gte('training_date', filters.start_date);
  }

  if (filters?.end_date) {
    query = query.lte('training_date', filters.end_date);
  }

  const { data, error } = await query.order('training_date', { ascending: false });

  if (error) {
    console.error('Error fetching club training logs:', error);
    return { error: 'ไม่สามารถดึงข้อมูลการฝึกได้' };
  }

  return { data };
}

export async function reviewHomeTrainingLog(
  logId: string,
  status: 'reviewed' | 'approved' | 'needs_improvement'
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return { error: 'ไม่พบข้อมูลโปรไฟล์' };
  }

  const { data, error } = await supabase
    .from('home_training_logs')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: profile.id,
    })
    .eq('id', logId)
    .select()
    .single();

  if (error) {
    console.error('Error reviewing training log:', error);
    return { error: 'ไม่สามารถตรวจสอบการฝึกได้' };
  }

  revalidatePath('/dashboard/coach/home-training');
  return { data };
}

export async function createHomeTrainingFeedback(input: CreateFeedbackInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'coach') {
    return { error: 'เฉพาะโค้ชเท่านั้นที่สามารถให้ feedback ได้' };
  }

  const { data, error } = await supabase
    .from('home_training_feedback')
    .insert({
      ...input,
      coach_id: profile.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating feedback:', error);
    return { error: 'ไม่สามารถสร้าง feedback ได้' };
  }

  // Also update the training log status
  await reviewHomeTrainingLog(input.training_log_id, 'reviewed');

  revalidatePath('/dashboard/coach/home-training');
  return { data };
}

export async function updateHomeTrainingFeedback(
  feedbackId: string,
  updates: Partial<CreateFeedbackInput>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('home_training_feedback')
    .update(updates)
    .eq('id', feedbackId)
    .select()
    .single();

  if (error) {
    console.error('Error updating feedback:', error);
    return { error: 'ไม่สามารถแก้ไข feedback ได้' };
  }

  revalidatePath('/dashboard/coach/home-training');
  return { data };
}

export async function deleteHomeTrainingFeedback(feedbackId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('home_training_feedback')
    .delete()
    .eq('id', feedbackId);

  if (error) {
    console.error('Error deleting feedback:', error);
    return { error: 'ไม่สามารถลบ feedback ได้' };
  }

  revalidatePath('/dashboard/coach/home-training');
  return { success: true };
}

export async function getAthleteHomeTrainingHistory(athleteId: string, days: number = 30) {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('home_training_logs')
    .select(`
      *,
      feedback:home_training_feedback(*)
    `)
    .eq('athlete_id', athleteId)
    .gte('training_date', startDate.toISOString().split('T')[0])
    .order('training_date', { ascending: false });

  if (error) {
    console.error('Error fetching athlete training history:', error);
    return { error: 'ไม่สามารถดึงประวัติการฝึกได้' };
  }

  return { data };
}
