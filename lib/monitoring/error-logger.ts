'use server';

import { createClient } from '@/lib/supabase/server';

export type ErrorType = 
  | 'auth' 
  | 'registration' 
  | 'rate_limit' 
  | 'validation' 
  | 'database' 
  | 'unknown';

interface LogErrorParams {
  errorType: ErrorType;
  errorCode?: string;
  errorMessage: string;
  errorDetails?: Record<string, any>;
  pageUrl?: string;
}

/**
 * บันทึก error ลงฐานข้อมูลเพื่อติดตามปัญหาที่ผู้ใช้เจอ
 */
export async function logError(params: LogErrorParams) {
  try {
    const supabase = await createClient();
    
    // ดึงข้อมูล user (ถ้ามี)
    const { data: { user } } = await supabase.auth.getUser();
    
    // บันทึก error log
    const { error } = await (supabase as any)
      .from('error_logs')
      .insert({
        user_id: user?.id || null,
        error_type: params.errorType,
        error_code: params.errorCode,
        error_message: params.errorMessage,
        error_details: params.errorDetails || null,
        page_url: params.pageUrl,
        // Note: ip_address และ user_agent จะถูกเพิ่มโดย database trigger หรือ middleware
      });
    
    if (error) {
      console.error('Failed to log error:', error);
    }
  } catch (err) {
    // ไม่ throw error เพื่อไม่ให้กระทบการทำงานหลัก
    console.error('Error in logError:', err);
  }
}

/**
 * บันทึก registration step เพื่อติดตามว่าผู้ใช้ติดขัดตรงไหน
 */
export async function logRegistrationStep(
  step: 'started' | 'auth_created' | 'profile_created' | 'athlete_created' | 'completed' | 'failed',
  email: string,
  userId?: string,
  stepData?: Record<string, any>,
  errorMessage?: string
) {
  try {
    const supabase = await createClient();
    
    const { error } = await (supabase as any)
      .from('registration_audit')
      .insert({
        user_id: userId || null,
        email,
        step,
        step_data: stepData || null,
        error_message: errorMessage || null,
      });
    
    if (error) {
      console.error('Failed to log registration step:', error);
    }
  } catch (err) {
    console.error('Error in logRegistrationStep:', err);
  }
}

/**
 * ดึงข้อผิดพลาดที่เกิดบ่อย (สำหรับ admin)
 */
export async function getCommonErrors(hours: number = 24) {
  const supabase = await createClient();
  
  const { data, error } = await (supabase as any)
    .from('error_logs')
    .select('error_type, error_code, error_message')
    .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false});
  
  if (error) {
    console.error('Failed to get common errors:', error);
    return [];
  }
  
  // นับจำนวนแต่ละ error
  const errorCounts = (data || []).reduce((acc: any, err: any) => {
    const key = `${err.error_type}:${err.error_code}`;
    if (!acc[key]) {
      acc[key] = {
        error_type: err.error_type,
        error_code: err.error_code,
        error_message: err.error_message,
        count: 0,
      };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, any>);
  
  return Object.values(errorCounts)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);
}

/**
 * ดึงการสมัครที่ไม่สมบูรณ์ (สำหรับ admin)
 */
export async function getIncompleteRegistrations() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('incomplete_registrations')
    .select('*')
    .limit(50);
  
  if (error) {
    console.error('Failed to get incomplete registrations:', error);
    return [];
  }
  
  return data;
}
