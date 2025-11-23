'use server';

/**
 * Membership Application Server Actions
 * 
 * This module provides server-side actions for the membership registration system.
 * All actions include proper authentication, authorization, validation, and error handling.
 * 
 * Actions:
 * - submitApplication(data): Submit new membership application (US-1, US-8)
 * - reviewApplication(applicationId, action, reason): Review application (US-3, US-5)
 * - createAthleteProfile(application): Create athlete profile from approved application (US-5)
 * 
 * Security:
 * - All actions verify authentication
 * - Input validation with Zod schemas
 * - RLS policies enforced at database level
 * - Activity logging for audit trail
 */

import { createClient } from '@/lib/supabase/server';
import { 
  applicationSubmissionSchema, 
  type ApplicationSubmissionInput 
} from './validation';
import type { MembershipApplication, PersonalInfo } from '@/types/database.types';

/**
 * Submit a new membership application
 * 
 * Validates: Requirements US-1, US-8
 * 
 * Process:
 * 1. Validate input with Zod schemas
 * 2. Verify authentication
 * 3. Check for duplicate application (UNIQUE constraint on user_id + club_id)
 * 4. Create application record with JSONB data structure
 * 5. Add initial activity log entry via add_activity_log() function
 * 6. Return success with application ID
 * 
 * @param data - Application submission data (club_id, personal_info, documents)
 * @returns { success: boolean, applicationId?: string, error?: string }
 */
export async function submitApplication(
  data: ApplicationSubmissionInput
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    // Step 1: Validate input with Zod schema
    const validationResult = applicationSubmissionSchema.safeParse(data);
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return { 
        success: false, 
        error: firstError || 'ข้อมูลไม่ถูกต้อง' 
      };
    }

    const validatedData = validationResult.data;

    // Step 2: Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { 
        success: false, 
        error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' 
      };
    }

    // Step 3: Check for duplicate application
    // The database has UNIQUE constraint on (user_id, club_id)
    // But we check first to provide better error message
    const { data: existingApplication, error: checkError } = await supabase
      .from('membership_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('club_id', validatedData.club_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for duplicate application:', checkError);
      return { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการตรวจสอบใบสมัคร' 
      };
    }

    if (existingApplication) {
      const status = (existingApplication as any).status as string;
      const statusMap: Record<string, string> = {
        pending: 'รอการอนุมัติ',
        approved: 'อนุมัติแล้ว',
        rejected: 'ไม่อนุมัติ',
        info_requested: 'รอข้อมูลเพิ่มเติม',
      };
      const statusText = statusMap[status] || 'มีอยู่แล้ว';

      return { 
        success: false, 
        error: `คุณมีใบสมัครสำหรับกีฬานี้อยู่แล้ว (สถานะ: ${statusText})` 
      };
    }

    // Step 4: Create application record with JSONB data structure
    const insertData = {
      user_id: user.id,
      club_id: validatedData.club_id,
      personal_info: validatedData.personal_info as any,
      documents: validatedData.documents as any,
      status: 'pending' as const,
      activity_log: [] as any, // Will be populated by trigger/function
    };

    const { data: newApplication, error: insertError } = await (supabase
      .from('membership_applications') as any)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application:', insertError);
      
      // Handle UNIQUE constraint violation
      if (insertError.code === '23505') {
        return { 
          success: false, 
          error: 'คุณมีใบสมัครสำหรับกีฬานี้อยู่แล้ว' 
        };
      }

      return { 
        success: false, 
        error: 'ไม่สามารถสร้างใบสมัครได้' 
      };
    }

    if (!newApplication) {
      return { 
        success: false, 
        error: 'ไม่สามารถสร้างใบสมัครได้' 
      };
    }

    // Step 5: Add initial activity log entry via add_activity_log() function
    const { error: logError } = await supabase.rpc('add_activity_log', {
      p_application_id: (newApplication as any).id,
      p_action: 'submitted',
      p_by_user: user.id,
      p_details: {
        club_id: validatedData.club_id,
        document_count: validatedData.documents.length,
      } as any,
    } as any);

    if (logError) {
      console.error('Error adding activity log:', logError);
      // Don't fail the entire operation if logging fails
      // The application was created successfully
    }

    // Step 6: Return success with application ID
    return { 
      success: true, 
      applicationId: (newApplication as any).id 
    };

  } catch (error) {
    console.error('Unexpected error in submitApplication:', error);
    return { 
      success: false, 
      error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' 
    };
  }
}

/**
 * Review a membership application (approve or reject)
 * 
 * Validates: Requirements US-3, US-5
 * 
 * Process:
 * 1. Verify authentication
 * 2. Verify coach/admin permission (check club_id match or admin role)
 * 3. Validate action and reason (reason required for rejection)
 * 4. Call update_application_status() database helper function
 * 5. If approved: call createAthleteProfile() to create athlete record
 * 6. Activity log entry added automatically via database function
 * 7. Return success/error with appropriate messages
 * 
 * @param applicationId - UUID of the application to review
 * @param action - 'approve' or 'reject'
 * @param reason - Optional reason for rejection (required if action is 'reject')
 * @returns { success: boolean, error?: string, profileId?: string }
 */
export async function reviewApplication(
  applicationId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<{ success: boolean; error?: string; profileId?: string }> {
  try {
    // Step 1: Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { 
        success: false, 
        error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' 
      };
    }

    // Step 2: Get application details and verify permission
    const { data: application, error: fetchError } = await supabase
      .from('membership_applications')
      .select('*, clubs(name, sport_type)')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      console.error('Error fetching application:', fetchError);
      return { 
        success: false, 
        error: 'ไม่พบใบสมัครที่ระบุ' 
      };
    }

    // Check if user is coach for this club or admin
    const { data: coachRecord } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .eq('club_id', (application as any).club_id)
      .maybeSingle();

    const { data: adminRecord } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isCoach = !!coachRecord;
    const isAdmin = !!adminRecord;

    if (!isCoach && !isAdmin) {
      return { 
        success: false, 
        error: 'คุณไม่มีสิทธิ์ในการพิจารณาใบสมัครนี้' 
      };
    }

    // Step 3: Validate action and reason
    if (action === 'reject' && !reason) {
      return { 
        success: false, 
        error: 'กรุณาระบุเหตุผลในการปฏิเสธ' 
      };
    }

    // Check if application is already processed
    const currentStatus = (application as any).status as string;
    if (currentStatus !== 'pending' && currentStatus !== 'info_requested') {
      const statusMap: Record<string, string> = {
        approved: 'อนุมัติแล้ว',
        rejected: 'ปฏิเสธแล้ว',
      };
      return { 
        success: false, 
        error: `ใบสมัครนี้${statusMap[currentStatus] || 'ดำเนินการแล้ว'}` 
      };
    }

    // Step 4: Call update_application_status() database helper function
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await supabase.rpc('update_application_status', {
      p_application_id: applicationId,
      p_new_status: newStatus,
      p_reviewed_by: user.id,
      p_notes: reason || null,
    } as any);

    if (updateError) {
      console.error('Error updating application status:', updateError);
      return { 
        success: false, 
        error: 'ไม่สามารถอัปเดตสถานะใบสมัครได้' 
      };
    }

    // Step 5: If approved, create athlete profile
    let profileId: string | undefined;
    if (action === 'approve') {
      const profileResult = await createAthleteProfile(application as any);
      
      if (!profileResult.success) {
        // Rollback status change if profile creation fails
        await supabase.rpc('update_application_status', {
          p_application_id: applicationId,
          p_new_status: 'pending',
          p_reviewed_by: user.id,
          p_notes: 'ไม่สามารถสร้างโปรไฟล์นักกีฬาได้ กรุณาลองใหม่อีกครั้ง',
        } as any);

        return { 
          success: false, 
          error: profileResult.error || 'ไม่สามารถสร้างโปรไฟล์นักกีฬาได้' 
        };
      }

      profileId = profileResult.profileId;
    }

    // Step 6: Activity log entry added automatically via database function
    // (handled by update_application_status function)

    // Step 7: Return success with appropriate message
    const successMessage = action === 'approve' 
      ? 'อนุมัติใบสมัครเรียบร้อยแล้ว' 
      : 'ปฏิเสธใบสมัครเรียบร้อยแล้ว';

    return { 
      success: true,
      profileId,
    };

  } catch (error) {
    console.error('Unexpected error in reviewApplication:', error);
    return { 
      success: false, 
      error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' 
    };
  }
}

/**
 * Create athlete profile from approved application
 * 
 * Validates: Requirements US-5
 * 
 * Process:
 * 1. Check if athlete record already exists for user+club
 * 2. Extract data from personal_info JSONB field
 * 3. Parse full_name into first_name and last_name
 * 4. Create record in athletes table with proper fields
 * 5. Update application with athlete profile_id reference
 * 6. Add activity log entry for profile creation
 * 7. Handle errors gracefully (duplicate, missing data)
 * 
 * @param application - The approved membership application
 * @returns { success: boolean, profileId?: string, error?: string }
 */
async function createAthleteProfile(
  application: MembershipApplication
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Step 1: Check if athlete record already exists
    const { data: existingAthlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', application.user_id)
      .eq('club_id', application.club_id)
      .maybeSingle();

    if (existingAthlete) {
      // Update application with existing profile_id
      await (supabase
        .from('membership_applications') as any)
        .update({ profile_id: (existingAthlete as any).id })
        .eq('id', application.id);

      return { 
        success: true, 
        profileId: (existingAthlete as any).id 
      };
    }

    // Step 2: Extract data from personal_info JSONB field
    const personalInfo = application.personal_info as PersonalInfo;
    
    if (!personalInfo.full_name || !personalInfo.phone_number) {
      return { 
        success: false, 
        error: 'ข้อมูลส่วนตัวไม่ครบถ้วน' 
      };
    }

    // Step 3: Parse full_name into first_name and last_name
    const nameParts = personalInfo.full_name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    // Get user email
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email || '';

    // Step 4: Create record in athletes table
    const athleteData = {
      user_id: application.user_id,
      club_id: application.club_id,
      first_name: firstName,
      last_name: lastName,
      nickname: null,
      date_of_birth: personalInfo.date_of_birth || '2000-01-01', // Default if not provided
      phone_number: personalInfo.phone_number,
      email: userEmail,
      gender: 'other', // Default, can be updated later
      health_notes: personalInfo.medical_conditions || null,
      profile_picture_url: null,
    };

    const { data: newAthlete, error: insertError } = await (supabase
      .from('athletes') as any)
      .insert(athleteData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating athlete profile:', insertError);
      
      // Handle duplicate constraint
      if (insertError.code === '23505') {
        return { 
          success: false, 
          error: 'โปรไฟล์นักกีฬาสำหรับกีฬานี้มีอยู่แล้ว' 
        };
      }

      return { 
        success: false, 
        error: 'ไม่สามารถสร้างโปรไฟล์นักกีฬาได้' 
      };
    }

    if (!newAthlete) {
      return { 
        success: false, 
        error: 'ไม่สามารถสร้างโปรไฟล์นักกีฬาได้' 
      };
    }

    const profileId = (newAthlete as any).id;

    // Step 5: Update application with athlete profile_id reference
    const { error: updateError } = await (supabase
      .from('membership_applications') as any)
      .update({ profile_id: profileId })
      .eq('id', application.id);

    if (updateError) {
      console.error('Error updating application with profile_id:', updateError);
      // Don't fail the entire operation - profile was created successfully
    }

    // Step 6: Add activity log entry for profile creation
    const { error: logError } = await supabase.rpc('add_activity_log', {
      p_application_id: application.id,
      p_action: 'profile_created',
      p_by_user: application.user_id,
      p_details: {
        profile_id: profileId,
        club_id: application.club_id,
      } as any,
    } as any);

    if (logError) {
      console.error('Error adding activity log:', logError);
      // Don't fail the entire operation
    }

    // Step 7: Return success with profile ID
    return { 
      success: true, 
      profileId 
    };

  } catch (error) {
    console.error('Unexpected error in createAthleteProfile:', error);
    return { 
      success: false, 
      error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' 
    };
  }
}
