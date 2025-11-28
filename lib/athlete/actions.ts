'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/audit/actions';
import { Database } from '@/types/database.types';

/**
 * Update athlete profile information
 * Allows updating: nickname, phone_number, health_notes, profile_picture
 * Prevents updating: club_id, first_name, last_name, email, date_of_birth, gender
 */
export async function updateAthleteProfile(
  athleteId: string,
  formData: FormData
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

    // Verify the athlete belongs to the current user
    const athleteQuery = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .maybeSingle();

    if (athleteQuery.error || !athleteQuery.data) {
      return { error: 'ไม่พบข้อมูลนักกีฬา' };
    }

    const athlete = athleteQuery.data as Database['public']['Tables']['athletes']['Row'];

    if (athlete.user_id !== user.id) {
      return { error: 'ไม่ได้รับอนุญาต: คุณไม่สามารถแก้ไขโปรไฟล์ของผู้อื่นได้' };
    }

    // Extract allowed fields from form data
    const nickname = formData.get('nickname') as string | null;
    const phoneNumber = formData.get('phone_number') as string;
    const healthNotes = formData.get('health_notes') as string | null;
    const profilePictureFile = formData.get('profile_picture') as File | null;

    // Validate required fields
    if (!phoneNumber) {
      return { error: 'กรุณากรอกเบอร์โทรศัพท์' };
    }

    // Validate phone number format (Thai phone number)
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[-\s]/g, ''))) {
      return { error: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' };
    }

    let profilePictureUrl = null;

    // Handle profile picture upload if provided
    if (profilePictureFile && profilePictureFile.size > 0) {
      // Validate file type
      if (!profilePictureFile.type.startsWith('image/')) {
        return { error: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น' };
      }

      // Validate file size (max 5MB)
      if (profilePictureFile.size > 5 * 1024 * 1024) {
        return { error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' };
      }

      // Generate unique filename
      const fileExt = profilePictureFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profilePictureFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      profilePictureUrl = publicUrl;
    }

    // Prepare update data (only allowed fields)
    const updateData: Database['public']['Tables']['athletes']['Update'] = {
      nickname: nickname || null,
      phone_number: phoneNumber,
      health_notes: healthNotes || null,
    };

    // Add profile picture URL if uploaded
    if (profilePictureUrl) {
      updateData.profile_picture_url = profilePictureUrl;
    }

    // Update athlete profile
    const { error: updateError } = await supabase
      .from('athletes')
      // @ts-ignore - TypeScript has issues with the update type inference
      .update(updateData)
      .eq('id', athleteId);

    if (updateError) {
      console.error('Update error:', updateError);
      return { error: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' };
    }

    // Log audit event
    await createAuditLog({
      userId: user.id,
      actionType: 'athlete.update',
      entityType: 'athlete',
      entityId: athleteId,
      details: updateData,
    });

    // Revalidate the profile page
    revalidatePath('/dashboard/athlete/profile');
    revalidatePath('/dashboard/athlete/profile/edit');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateAthleteProfile:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get athlete profile by user ID
 */
export async function getAthleteProfile(userId: string) {
  try {
    const supabase = await createClient();

    const { data: athlete, error } = await supabase
      .from('athletes')
      .select(
        `
        *,
        clubs (
          id,
          name,
          description,
          sport_type
        )
      `
      )
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching athlete profile:', error);
      return { error: 'ไม่พบข้อมูลโปรไฟล์' };
    }

    return { data: athlete };
  } catch (error) {
    console.error('Unexpected error in getAthleteProfile:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Update athlete profile with complete information including documents
 * Used in the profile edit page with full form
 */
export async function updateAthleteProfileComplete(
  athleteId: string,
  data: {
    personalInfo: {
      full_name: string;
      nickname?: string;
      gender: 'male' | 'female' | 'other';
      date_of_birth: string;
      phone_number: string;
      address: string;
      emergency_contact: string;
      blood_type?: string;
      medical_conditions?: string;
    };
    documents: {
      id_card: { url: string; file_name: string; file_size: number } | null;
      house_registration: { url: string; file_name: string; file_size: number } | null;
      birth_certificate: { url: string; file_name: string; file_size: number } | null;
      parent_id_card: { url: string; file_name: string; file_size: number } | null;
      parent_house_registration: { url: string; file_name: string; file_size: number } | null;
    };
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

    // Verify the athlete belongs to the current user - only allow editing own profile
    if (athleteId !== user.id) {
      return { error: 'ไม่ได้รับอนุญาต: คุณไม่สามารถแก้ไขโปรไฟล์ของผู้อื่นได้' };
    }

    // Verify profile exists
    const { data: athlete, error: athleteError } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('id', athleteId)
      .single();

    if (athleteError || !athlete) {
      return { error: 'ไม่พบข้อมูลนักกีฬา' };
    }

    // Split full name into first and last name
    const nameParts = data.personalInfo.full_name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Update athlete profile
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        nickname: data.personalInfo.nickname || null,
        phone_number: data.personalInfo.phone_number,
        health_notes: data.personalInfo.medical_conditions || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', athleteId);

    if (updateError) {
      console.error('Update athlete error:', updateError);
      return { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลนักกีฬา' };
    }

    // Update membership application if exists
    const { data: application } = await (supabase as any)
      .from('membership_applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    if (application) {
      // Prepare documents array
      const documentsArray = [];
      
      if (data.documents.id_card) {
        documentsArray.push({
          type: 'id_card',
          url: data.documents.id_card.url,
          file_name: data.documents.id_card.file_name,
          file_size: data.documents.id_card.file_size,
          uploaded_at: new Date().toISOString(),
        });
      }
      
      if (data.documents.house_registration) {
        documentsArray.push({
          type: 'house_registration',
          url: data.documents.house_registration.url,
          file_name: data.documents.house_registration.file_name,
          file_size: data.documents.house_registration.file_size,
          uploaded_at: new Date().toISOString(),
        });
      }
      
      if (data.documents.birth_certificate) {
        documentsArray.push({
          type: 'birth_certificate',
          url: data.documents.birth_certificate.url,
          file_name: data.documents.birth_certificate.file_name,
          file_size: data.documents.birth_certificate.file_size,
          uploaded_at: new Date().toISOString(),
        });
      }

      if (data.documents.parent_id_card) {
        documentsArray.push({
          type: 'parent_id_card',
          url: data.documents.parent_id_card.url,
          file_name: data.documents.parent_id_card.file_name,
          file_size: data.documents.parent_id_card.file_size,
          uploaded_at: new Date().toISOString(),
        });
      }

      if (data.documents.parent_house_registration) {
        documentsArray.push({
          type: 'parent_house_registration',
          url: data.documents.parent_house_registration.url,
          file_name: data.documents.parent_house_registration.file_name,
          file_size: data.documents.parent_house_registration.file_size,
          uploaded_at: new Date().toISOString(),
        });
      }

      // Update application
      const { error: appUpdateError } = await (supabase as any)
        .from('membership_applications')
        .update({
          personal_info: data.personalInfo,
          documents: documentsArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (appUpdateError) {
        console.error('Update application error:', appUpdateError);
        // Don't fail the whole operation if application update fails
      }
    }

    // Log audit event
    await createAuditLog({
      userId: user.id,
      actionType: 'athlete.update' as any,
      entityType: 'athlete',
      entityId: athleteId,
      details: {
        personal_info: data.personalInfo,
        documents_updated: Object.keys(data.documents).filter(
          (key) => data.documents[key as keyof typeof data.documents] !== null
        ),
      },
    });

    // Revalidate pages
    revalidatePath('/dashboard/athlete/profile');
    revalidatePath('/dashboard/athlete/profile/edit');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateAthleteProfileComplete:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}
