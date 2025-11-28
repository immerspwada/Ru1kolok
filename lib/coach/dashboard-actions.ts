'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

export interface DashboardStats {
  totalAthletes: number;
  activeAthletes: number;
  totalSessions: number;
  upcomingSessions: number;
  todaySessions: number;
  pendingApplications: number;
  pendingLeaveRequests: number;
  totalTournaments: number;
  activeTournaments: number;
  recentPerformanceRecords: number;
}

export interface RecentActivity {
  id: string;
  type: 'session' | 'attendance' | 'application' | 'leave_request' | 'tournament' | 'performance';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  link?: string;
}

export interface UpcomingSession {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  attendance_count: number;
  total_athletes: number;
}

// Get comprehensive dashboard statistics
export async function getCoachDashboardStats() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role')
    .eq('id', user.id)
    .single() as { data: { club_id: string; role: string } | null; error: any };

  if (!profile || profile.role !== 'coach' || !profile.club_id) {
    return { error: 'ไม่พบข้อมูลโค้ช' };
  }

  const clubId = profile.club_id;
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Run all queries in parallel for better performance
  const [
    athletesResult,
    activeAthletesResult,
    sessionsResult,
    upcomingSessionsResult,
    todaySessionsResult,
    applicationsResult,
    leaveRequestsResult,
    tournamentsResult,
    activeTournamentsResult,
    performanceResult,
  ] = await Promise.all([
    // Total athletes
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('role', 'athlete')
      .eq('membership_status', 'approved'),
    
    // Active athletes (attended in last 30 days)
    supabase
      .from('attendance')
      .select('athlete_id', { count: 'exact', head: true })
      .gte('check_in_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'present'),
    
    // Total sessions
    supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId),
    
    // Upcoming sessions
    supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .gte('session_date', today),
    
    // Today's sessions
    supabase
      .from('training_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('session_date', today),
    
    // Pending applications
    supabase
      .from('membership_applications')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', 'pending'),
    
    // Pending leave requests
    supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('athlete_id', 
        supabase
          .from('profiles')
          .select('id')
          .eq('club_id', clubId)
          .eq('role', 'athlete')
      ),
    
    // Total tournaments
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId),
    
    // Active tournaments
    supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .in('status', ['open', 'draft']),
    
    // Recent performance records (last 7 days)
    supabase
      .from('performance_records')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .gte('test_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const stats: DashboardStats = {
    totalAthletes: athletesResult.count || 0,
    activeAthletes: activeAthletesResult.count || 0,
    totalSessions: sessionsResult.count || 0,
    upcomingSessions: upcomingSessionsResult.count || 0,
    todaySessions: todaySessionsResult.count || 0,
    pendingApplications: applicationsResult.count || 0,
    pendingLeaveRequests: leaveRequestsResult.count || 0,
    totalTournaments: tournamentsResult.count || 0,
    activeTournaments: activeTournamentsResult.count || 0,
    recentPerformanceRecords: performanceResult.count || 0,
  };

  return { data: stats };
}

// Get upcoming sessions with attendance info
export async function getUpcomingSessions(limit: number = 5) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single() as { data: { club_id: string } | null; error: any };

  if (!profile?.club_id) {
    return { error: 'ไม่พบข้อมูลโค้ช' };
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select('id, title, session_date, start_time, end_time, location')
    .eq('club_id', profile.club_id)
    .gte('session_date', today)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(limit) as { data: any[] | null; error: any };

  if (error) {
    return { error: 'ไม่สามารถโหลดข้อมูลได้' };
  }

  // Get attendance counts for each session
  const sessionsWithAttendance = await Promise.all(
    (sessions || []).map(async (session) => {
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('status', 'present');

      const { count: totalAthletes } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', profile.club_id)
        .eq('role', 'athlete')
        .eq('membership_status', 'approved');

      return {
        ...session,
        attendance_count: attendanceCount || 0,
        total_athletes: totalAthletes || 0,
      };
    })
  );

  return { data: sessionsWithAttendance };
}

// Get recent activities
export async function getRecentActivities(limit: number = 10) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single() as { data: { club_id: string } | null; error: any };

  if (!profile?.club_id) {
    return { error: 'ไม่พบข้อมูลโค้ช' };
  }

  const activities: RecentActivity[] = [];

  // Get recent sessions (last 7 days)
  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select('id, title, session_date, created_at')
    .eq('club_id', profile.club_id)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  recentSessions?.forEach((session) => {
    activities.push({
      id: session.id,
      type: 'session',
      title: 'สร้างการฝึกซ้อมใหม่',
      description: session.title,
      timestamp: session.created_at,
      link: `/dashboard/coach/sessions/${session.id}`,
    });
  });

  // Get recent applications
  const { data: recentApplications } = await supabase
    .from('membership_applications')
    .select('id, status, created_at, profiles!membership_applications_applicant_id_fkey(full_name)')
    .eq('club_id', profile.club_id)
    .order('created_at', { ascending: false })
    .limit(3);

  recentApplications?.forEach((app: any) => {
    activities.push({
      id: app.id,
      type: 'application',
      title: 'ใบสมัครใหม่',
      description: `${app.profiles?.full_name || 'นักกีฬา'} ส่งใบสมัคร`,
      timestamp: app.created_at,
      status: app.status,
      link: '/dashboard/coach/applications',
    });
  });

  // Get recent tournaments
  const { data: recentTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status, created_at')
    .eq('club_id', profile.club_id)
    .order('created_at', { ascending: false })
    .limit(2);

  recentTournaments?.forEach((tournament) => {
    activities.push({
      id: tournament.id,
      type: 'tournament',
      title: 'ทัวร์นาเมนต์ใหม่',
      description: tournament.name,
      timestamp: tournament.created_at,
      status: tournament.status,
      link: '/dashboard/coach/tournaments',
    });
  });

  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { data: activities.slice(0, limit) };
}

// Get pending tasks summary
export async function getPendingTasks() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'ไม่พบข้อมูลผู้ใช้' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single() as { data: { club_id: string } | null; error: any };

  if (!profile?.club_id) {
    return { error: 'ไม่พบข้อมูลโค้ช' };
  }

  const today = new Date().toISOString().split('T')[0];

  const [applicationsResult, leaveRequestsResult, todaySessionsResult] = await Promise.all([
    supabase
      .from('membership_applications')
      .select('id, profiles!membership_applications_applicant_id_fkey(full_name)')
      .eq('club_id', profile.club_id)
      .eq('status', 'pending')
      .limit(5),
    
    supabase
      .from('leave_requests')
      .select('id, profiles!leave_requests_athlete_id_fkey(full_name), start_date, end_date')
      .eq('status', 'pending')
      .in('athlete_id', 
        supabase
          .from('profiles')
          .select('id')
          .eq('club_id', profile.club_id)
          .eq('role', 'athlete')
      )
      .limit(5),
    
    supabase
      .from('training_sessions')
      .select('id, title, start_time')
      .eq('club_id', profile.club_id)
      .eq('session_date', today)
      .order('start_time', { ascending: true }),
  ]);

  return {
    data: {
      pendingApplications: applicationsResult.data || [],
      pendingLeaveRequests: leaveRequestsResult.data || [],
      todaySessions: todaySessionsResult.data || [],
    },
  };
}
