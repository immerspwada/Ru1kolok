import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Calendar, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getAthleteSessions } from '@/lib/athlete/attendance-actions';
import { ScheduleCard } from '@/components/athlete/ScheduleCard';

export default async function SchedulePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get upcoming sessions with attendance status
  const { data: sessions, error } = await getAthleteSessions({ upcoming: true });

  if (error) {
    console.error('Error fetching sessions:', error);
  }

  // Get coach names for sessions
  const sessionsWithCoach = await Promise.all(
    (sessions || []).map(async (session) => {
      if (session.coach_id) {
        const { data: coach } = await supabase
          .from('coaches')
          .select('first_name, last_name')
          .eq('id', session.coach_id)
          .single();
        
        type CoachData = { first_name: string; last_name: string } | null;
        const coachData = coach as CoachData;
        
        return {
          ...session,
          coach_name: coachData ? `${coachData.first_name} ${coachData.last_name}` : undefined,
        };
      }
      return {
        ...session,
        coach_name: undefined,
      };
    })
  );

  // Group sessions by date
  const sessionsByDate = sessionsWithCoach?.reduce((acc, session) => {
    const date = session.session_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof sessionsWithCoach>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl p-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/athlete"
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ตารางการฝึกซ้อม
              </h1>
              <p className="text-sm text-gray-600">
                ดูตารางการฝึกซ้อมที่กำลังจะมาถึง
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-6">
        {sessionsByDate && Object.keys(sessionsByDate).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(sessionsByDate).map(([date, sessions]) => (
              <div key={date}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString('th-TH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((session) => (
                    <ScheduleCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              ยังไม่มีตารางการฝึกซ้อม
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              ตารางการฝึกซ้อมจะแสดงที่นี่เมื่อโค้ชสร้างขึ้น
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
