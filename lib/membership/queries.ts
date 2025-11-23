'use server';

/**
 * Membership Application Query Functions
 * 
 * This module provides server-side query functions for the membership registration system.
 * All functions include proper authentication, authorization, and error handling.
 * 
 * Functions:
 * - getAvailableClubs(): Fetch clubs with coach info and member count (US-2)
 * - getMyApplications(userId): Athlete's applications with club details (US-4)
 * - getClubApplications(clubId): Coach's applications for their club (US-3)
 * - getAllApplications(filters): Admin view with optional filters (US-7)
 * - getApplicationDetails(applicationId): Full application with JSONB data (US-3, US-4, US-8)
 * 
 * Security:
 * - All queries respect RLS policies
 * - Athletes can only view their own applications
 * - Coaches can only view applications for their clubs
 * - Admins can view all applications
 */

import { createClient } from '@/lib/supabase/server';
import { MembershipApplication, ApplicationStatus } from '@/types/database.types';

/**
 * Get available clubs with coach info and member count
 * Used for sport selection during registration
 * Validates: Requirements US-2
 */
export async function getAvailableClubs() {
  try {
    const supabase = await createClient();

    // Fetch clubs with coach information
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select(
        `
        id,
        name,
        description,
        sport_type,
        coaches (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .order('name');

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
      return { error: 'ไม่สามารถโหลดรายการกีฬาได้' };
    }

    // Get member count for each club
    const clubsWithCount = await Promise.all(
      (clubs || []).map(async (club: any) => {
        const { count, error: countError } = await supabase
          .from('athletes')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id);

        if (countError) {
          console.error('Error counting members:', countError);
        }

        return {
          ...club,
          member_count: count || 0,
          coach: Array.isArray(club.coaches) && club.coaches.length > 0 ? club.coaches[0] : null,
        };
      })
    );

    return { data: clubsWithCount };
  } catch (error) {
    console.error('Unexpected error in getAvailableClubs:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get athlete's own applications with club details
 * Validates: Requirements US-4
 */
export async function getMyApplications(userId: string) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Verify user is requesting their own applications
    if (user.id !== userId) {
      return { error: 'ไม่ได้รับอนุญาต: คุณสามารถดูเฉพาะใบสมัครของตัวเองเท่านั้น' };
    }

    // Fetch applications with club details
    const { data: applications, error } = await supabase
      .from('membership_applications')
      .select(
        `
        *,
        clubs (
          id,
          name,
          sport_type,
          description
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return { error: 'ไม่สามารถโหลดใบสมัครได้' };
    }

    return { data: applications as (MembershipApplication & { clubs: any })[] };
  } catch (error) {
    console.error('Unexpected error in getMyApplications:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get applications for a specific club (for coaches)
 * Validates: Requirements US-3
 */
export async function getClubApplications(clubId: string) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Verify user is a coach for this club
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id, club_id')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .maybeSingle();

    if (coachError || !coach) {
      return { error: 'ไม่ได้รับอนุญาต: คุณไม่ใช่โค้ชของกีฬานี้' };
    }

    // Fetch applications for the club with applicant info
    const { data: applications, error } = await supabase
      .from('membership_applications')
      .select(
        `
        *,
        clubs (
          id,
          name,
          sport_type
        )
      `
      )
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching club applications:', error);
      return { error: 'ไม่สามารถโหลดใบสมัครได้' };
    }

    return { data: applications as (MembershipApplication & { clubs: any })[] };
  } catch (error) {
    console.error('Unexpected error in getClubApplications:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get all applications with optional filters (for admins)
 * Validates: Requirements US-7
 */
export async function getAllApplications(filters?: {
  clubId?: string;
  status?: ApplicationStatus;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Verify user is an admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || !userRole || (userRole as any).role !== 'admin') {
      return { error: 'ไม่ได้รับอนุญาต: เฉพาะผู้ดูแลระบบเท่านั้น' };
    }

    // Build query with filters
    let query = supabase
      .from('membership_applications')
      .select(
        `
        *,
        clubs (
          id,
          name,
          sport_type
        )
      `
      );

    // Apply filters
    if (filters?.clubId) {
      query = query.eq('club_id', filters.clubId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Execute query
    const { data: applications, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all applications:', error);
      return { error: 'ไม่สามารถโหลดใบสมัครได้' };
    }

    return { data: applications as (MembershipApplication & { clubs: any })[] };
  } catch (error) {
    console.error('Unexpected error in getAllApplications:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get full application details with all JSONB data
 * Validates: Requirements US-3, US-4, US-8
 */
export async function getApplicationDetails(applicationId: string) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ' };
    }

    // Fetch application with club details
    const { data: application, error } = await supabase
      .from('membership_applications')
      .select(
        `
        *,
        clubs (
          id,
          name,
          sport_type,
          description
        )
      `
      )
      .eq('id', applicationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching application details:', error);
      return { error: 'ไม่สามารถโหลดรายละเอียดใบสมัครได้' };
    }

    if (!application) {
      return { error: 'ไม่พบใบสมัคร' };
    }

    // Verify user has permission to view this application
    // Athletes can view their own, coaches can view their club's, admins can view all
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = (userRole as any)?.role === 'admin';
    const isOwner = (application as any).user_id === user.id;

    // Check if user is coach of the club
    let isCoach = false;
    if (!isOwner && !isAdmin) {
      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .eq('club_id', (application as any).club_id)
        .maybeSingle();

      isCoach = !!coach;
    }

    if (!isOwner && !isCoach && !isAdmin) {
      return { error: 'ไม่ได้รับอนุญาต: คุณไม่สามารถดูใบสมัครนี้ได้' };
    }

    return { data: application as MembershipApplication & { clubs: any } };
  } catch (error) {
    console.error('Unexpected error in getApplicationDetails:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}
