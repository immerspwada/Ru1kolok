'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import { createAuditLog } from '@/lib/audit/actions';

type TrainingSession = Database['public']['Tables']['training_sessions']['Row'];

interface SessionWithDetails extends TrainingSession {
  clubs?: {
    id: string;
    name: string;
    sport_type: string;
  };
  coaches?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  attendance_count?: number;
}

interface SystemAttendanceStats {
  totalSessions: number;
  totalAttendanceRecords: number;
  averageAttendanceRate: number;
  activeAthletes: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
}

interface ClubStats {
  clubId: string;
  clubName: string;
  sportType: string;
  totalSessions: number;
  totalAttendanceRecords: number;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  activeAthletes: number;
}

/**
 * Get all training sessions across all clubs
 * Admin can view all sessions in the system
 */
export async function getAllSessions(filter?: {
  clubId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
}): Promise<{ data?: SessionWithDetails[]; error?: string }> {
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

    // Verify user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // @ts-ignore - Supabase type inference issue
    if (roleError || !userRole || userRole.role !== 'admin') {
      return { error: 'ไม่ได้รับอนุญาต: ต้องเป็นแอดมินเท่านั้น' };
    }

    // Build query
    let query = supabase
      .from('training_sessions')
      .select(`
        *,
        clubs (
          id,
          name,
          sport_type
        ),
        coaches (
          id,
          first_name,
          last_name
        )
      `)
      .order('session_date', { ascending: false })
      .order('start_time', { ascending: false });

    // Apply filters
    if (filter?.clubId) {
      query = query.eq('club_id', filter.clubId);
    }

    if (filter?.startDate) {
      query = query.gte('session_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('session_date', filter.endDate);
    }

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลตารางฝึกซ้อม' };
    }

    // Get attendance counts for each session
    const sessionsWithCounts = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          // @ts-ignore
          .eq('session_id', session.id)
          .eq('status', 'present');

        return {
          // @ts-ignore
          ...session,
          attendance_count: count || 0,
        };
      })
    );

    return { data: sessionsWithCounts };
  } catch (error) {
    console.error('Unexpected error in getAllSessions:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get system-wide attendance statistics
 * Provides overview of all attendance across the system
 */
export async function getAttendanceStats(filter?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ data?: SystemAttendanceStats; error?: string }> {
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

    // Verify user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // @ts-ignore - Supabase type inference issue
    if (roleError || !userRole || userRole.role !== 'admin') {
      return { error: 'ไม่ได้รับอนุญาต: ต้องเป็นแอดมินเท่านั้น' };
    }

    // Get total sessions count
    let sessionsQuery = supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true });

    if (filter?.startDate) {
      sessionsQuery = sessionsQuery.gte('session_date', filter.startDate);
    }

    if (filter?.endDate) {
      sessionsQuery = sessionsQuery.lte('session_date', filter.endDate);
    }

    const { count: totalSessions } = await sessionsQuery;

    // Get all attendance records with date filtering
    let attendanceQuery = supabase
      .from('attendance')
      .select(`
        *,
        training_sessions!inner (
          session_date
        )
      `);

    if (filter?.startDate) {
      // @ts-ignore
      attendanceQuery = attendanceQuery.gte('training_sessions.session_date', filter.startDate);
    }

    if (filter?.endDate) {
      // @ts-ignore
      attendanceQuery = attendanceQuery.lte('training_sessions.session_date', filter.endDate);
    }

    const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;

    if (attendanceError) {
      console.error('Attendance query error:', attendanceError);
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ' };
    }

    // Calculate statistics
    const totalAttendanceRecords = attendanceRecords?.length || 0;
    // @ts-ignore
    const presentCount = attendanceRecords?.filter((a) => a.status === 'present').length || 0;
    // @ts-ignore
    const absentCount = attendanceRecords?.filter((a) => a.status === 'absent').length || 0;
    // @ts-ignore
    const excusedCount = attendanceRecords?.filter((a) => a.status === 'excused').length || 0;
    // @ts-ignore
    const lateCount = attendanceRecords?.filter((a) => a.status === 'late').length || 0;

    // Calculate average attendance rate
    const averageAttendanceRate =
      totalAttendanceRecords > 0
        ? Math.round(((presentCount + lateCount) / totalAttendanceRecords) * 100 * 10) / 10
        : 0;

    // Get count of unique active athletes (athletes with at least one attendance record)
    const uniqueAthletes = new Set(
      // @ts-ignore
      attendanceRecords?.map((record) => record.athlete_id) || []
    );
    const activeAthletes = uniqueAthletes.size;

    const stats: SystemAttendanceStats = {
      totalSessions: totalSessions || 0,
      totalAttendanceRecords,
      averageAttendanceRate,
      activeAthletes,
      presentCount,
      absentCount,
      excusedCount,
      lateCount,
    };

    return { data: stats };
  } catch (error) {
    console.error('Unexpected error in getAttendanceStats:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Get attendance statistics broken down by club
 * Shows performance comparison across clubs
 */
export async function getClubStats(filter?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ data?: ClubStats[]; error?: string }> {
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

    // Verify user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // @ts-ignore - Supabase type inference issue
    if (roleError || !userRole || userRole.role !== 'admin') {
      return { error: 'ไม่ได้รับอนุญาต: ต้องเป็นแอดมินเท่านั้น' };
    }

    // Get all clubs
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id, name, sport_type')
      .order('name');

    if (clubsError) {
      console.error('Clubs query error:', clubsError);
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสโมสร' };
    }

    // Get stats for each club
    const clubStatsPromises = (clubs || []).map(async (club) => {
      // Get sessions count for this club
      let sessionsQuery = supabase
        .from('training_sessions')
        .select('*', { count: 'exact', head: true })
        // @ts-ignore
        .eq('club_id', club.id);

      if (filter?.startDate) {
        sessionsQuery = sessionsQuery.gte('session_date', filter.startDate);
      }

      if (filter?.endDate) {
        sessionsQuery = sessionsQuery.lte('session_date', filter.endDate);
      }

      const { count: totalSessions } = await sessionsQuery;

      // Get attendance records for this club's sessions
      let attendanceQuery = supabase
        .from('attendance')
        .select(`
          *,
          training_sessions!inner (
            club_id,
            session_date
          )
        `)
        // @ts-ignore
        .eq('training_sessions.club_id', club.id);

      if (filter?.startDate) {
        // @ts-ignore
        attendanceQuery = attendanceQuery.gte('training_sessions.session_date', filter.startDate);
      }

      if (filter?.endDate) {
        // @ts-ignore
        attendanceQuery = attendanceQuery.lte('training_sessions.session_date', filter.endDate);
      }

      const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;

      if (attendanceError) {
        // @ts-ignore
        console.error(`Attendance query error for club ${club.id}:`, attendanceError);
      }

      // Calculate statistics
      const totalAttendanceRecords = attendanceRecords?.length || 0;
      // @ts-ignore
      const presentCount = attendanceRecords?.filter((a) => a.status === 'present').length || 0;
      // @ts-ignore
      const absentCount = attendanceRecords?.filter((a) => a.status === 'absent').length || 0;
      // @ts-ignore
      const excusedCount = attendanceRecords?.filter((a) => a.status === 'excused').length || 0;
      // @ts-ignore
      const lateCount = attendanceRecords?.filter((a) => a.status === 'late').length || 0;

      // Calculate attendance rate
      const attendanceRate =
        totalAttendanceRecords > 0
          ? Math.round(((presentCount + lateCount) / totalAttendanceRecords) * 100 * 10) / 10
          : 0;

      // Get count of unique active athletes in this club
      const uniqueAthletes = new Set(
        // @ts-ignore
        attendanceRecords?.map((record) => record.athlete_id) || []
      );
      const activeAthletes = uniqueAthletes.size;

      const clubStat: ClubStats = {
        // @ts-ignore
        clubId: club.id,
        // @ts-ignore
        clubName: club.name,
        // @ts-ignore
        sportType: club.sport_type,
        totalSessions: totalSessions || 0,
        totalAttendanceRecords,
        attendanceRate,
        presentCount,
        absentCount,
        excusedCount,
        lateCount,
        activeAthletes,
      };

      return clubStat;
    });

    const clubStats = await Promise.all(clubStatsPromises);

    // Sort by attendance rate (highest first)
    clubStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

    return { data: clubStats };
  } catch (error) {
    console.error('Unexpected error in getClubStats:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Update any training session (admin privilege)
 * Admin can modify any session regardless of club or coach
 * Requirements: BR3 - Admin can edit everything
 */
export async function updateAnySession(
  sessionId: string,
  updates: {
    title?: string;
    session_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    description?: string;
    max_participants?: number | null;
    status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  }
): Promise<{ data?: TrainingSession; error?: string }> {
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

    // Verify user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // @ts-ignore - Supabase type inference issue
    if (roleError || !userRole || userRole.role !== 'admin') {
      return { error: 'ไม่ได้รับอนุญาต: ต้องเป็นแอดมินเท่านั้น' };
    }

    // Validate session exists
    const { data: existingSession, error: fetchError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return { error: 'ไม่พบตารางฝึกซ้อมที่ต้องการแก้ไข' };
    }

    // Validate date is not in the past (if updating session_date)
    if (updates.session_date) {
      const sessionDate = new Date(updates.session_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (sessionDate < today) {
        return { error: 'ไม่สามารถกำหนดวันที่ในอดีตได้' };
      }
    }

    // Validate time range (if updating times)
    if (updates.start_time && updates.end_time) {
      if (updates.start_time >= updates.end_time) {
        return { error: 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด' };
      }
    }

    // Update the session
    const { data: updatedSession, error: updateError } = await supabase
      .from('training_sessions')
      // @ts-ignore - Supabase type inference issue with update
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Session update error:', updateError);
      return { error: 'เกิดข้อผิดพลาดในการแก้ไขตารางฝึกซ้อม' };
    }

    // Create audit log
    await createAuditLog({
      userId: user.id,
      userRole: 'admin',
      actionType: 'training_session.update',
      entityType: 'training_session',
      entityId: sessionId,
      details: {
        updates,
        // @ts-ignore
        previousValues: existingSession,
      },
    });

    return { data: updatedSession };
  } catch (error) {
    console.error('Unexpected error in updateAnySession:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}

/**
 * Delete a training session (hard delete - admin only)
 * This permanently removes the session and all related attendance records
 * Requirements: BR3 - Admin can delete everything
 */
export async function deleteSession(sessionId: string): Promise<{ success?: boolean; error?: string }> {
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

    // Verify user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // @ts-ignore - Supabase type inference issue
    if (roleError || !userRole || userRole.role !== 'admin') {
      return { error: 'ไม่ได้รับอนุญาต: ต้องเป็นแอดมินเท่านั้น' };
    }

    // Get session details before deletion for audit log
    const { data: sessionToDelete, error: fetchError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !sessionToDelete) {
      return { error: 'ไม่พบตารางฝึกซ้อมที่ต้องการลบ' };
    }

    // Delete related attendance records first (cascade delete)
    const { error: attendanceDeleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('session_id', sessionId);

    if (attendanceDeleteError) {
      console.error('Attendance delete error:', attendanceDeleteError);
      return { error: 'เกิดข้อผิดพลาดในการลบข้อมูลการเข้าร่วม' };
    }

    // Delete related leave requests
    const { error: leaveDeleteError } = await supabase
      .from('leave_requests')
      .delete()
      .eq('session_id', sessionId);

    if (leaveDeleteError) {
      console.error('Leave requests delete error:', leaveDeleteError);
      // Continue even if this fails - leave_requests might not exist
    }

    // Delete the session
    const { error: deleteError } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Session delete error:', deleteError);
      return { error: 'เกิดข้อผิดพลาดในการลบตารางฝึกซ้อม' };
    }

    // Create audit log
    await createAuditLog({
      userId: user.id,
      userRole: 'admin',
      actionType: 'training_session.delete',
      entityType: 'training_session',
      entityId: sessionId,
      details: {
        // @ts-ignore
        deletedSession: sessionToDelete,
        deletedAt: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteSession:', error);
    return { error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' };
  }
}
