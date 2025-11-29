import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SchedulePageClient } from '@/components/athlete/SchedulePageClient';

export default async function SchedulePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get athlete profile
  const athleteResult = await supabase
    .from('athletes')
    .select('id, club_id')
    .eq('user_id', user.id)
    .single();
  const athlete = athleteResult.data as { id: string; club_id: string } | null;

  if (!athlete) {
    redirect('/dashboard/athlete');
  }

  // Get all sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Note: coach_id references auth.users, not coaches table
  // So we can't use Supabase's automatic join
  const allSessionsResult = await supabase
    .from('training_sessions')
    .select('*')
    .eq('club_id', athlete.club_id)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true });
  const allSessions = allSessionsResult.data as any[] | null;

  // Get coaches for this club to map coach names
  const coachesResult = await supabase
    .from('coaches')
    .select('user_id, first_name, last_name')
    .eq('club_id', athlete.club_id);
  const coaches = coachesResult.data || [];
  
  // Create coach map (user_id -> name)
  const coachMap = new Map(
    coaches.map((c) => [c.user_id, `${c.first_name} ${c.last_name}`])
  );

  // Get attendance records for this athlete
  const attendanceRecordsResult = await supabase
    .from('attendance')
    .select('training_session_id, status, check_in_time')
    .eq('athlete_id', athlete.id);
  const attendanceRecords = attendanceRecordsResult.data as Array<{
    training_session_id: string;
    status: string;
    check_in_time: string | null;
  }> | null;

  // Create attendance map
  const attendanceMap = new Map(
    attendanceRecords?.map((record) => [
      record.training_session_id,
      { status: record.status, check_in_time: record.check_in_time },
    ]) || []
  );

  // Enhance sessions with attendance info
  const enhancedSessions = allSessions?.map((session) => {
    const attendance = attendanceMap.get(session.id);
    const sessionDate = new Date(session.session_date);
    const isPast = sessionDate < today;
    const isToday = sessionDate.toDateString() === today.toDateString();
    
    return {
      id: session.id,
      title: session.title,
      session_name: session.session_name,
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      location: session.location,
      description: session.description,
      attendance_status: attendance?.status,
      check_in_time: attendance?.check_in_time,
      is_past: isPast,
      is_today: isToday,
      coach_name: session.coach_id ? coachMap.get(session.coach_id) : undefined,
    };
  }) || [];

  // Calculate stats
  const totalSessions = enhancedSessions.length;
  const attendedCount = enhancedSessions.filter(
    (s) => s.attendance_status === 'present'
  ).length;
  const attendanceRate = totalSessions > 0 
    ? Math.round((attendedCount / totalSessions) * 100) 
    : 0;

  return (
    <SchedulePageClient
      sessions={enhancedSessions}
      stats={{
        totalSessions,
        attendedCount,
        attendanceRate,
      }}
    />
  );
}
