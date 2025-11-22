import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getSessionAttendance } from '@/lib/coach/attendance-actions';
import { AttendanceSheetWrapper } from '@/components/coach/AttendanceSheetWrapper';

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default async function CoachAttendanceMarkingPage({ params }: PageProps) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get coach profile
  const { data: coach } = await supabase
    .from('coaches')
    .select('id, club_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!coach) {
    redirect('/dashboard/coach');
  }

  // Fetch session and athletes
  const { data: athletes, session, error } = await getSessionAttendance(params.sessionId);

  if (error || !session || !athletes) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="mx-auto max-w-7xl p-6">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/coach/attendance"
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">เช็คชื่อ</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-6">
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-red-600">{error || 'ไม่พบข้อมูลตารางฝึกซ้อม'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl p-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/coach/sessions"
              className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">เช็คชื่อ</h1>
              <p className="text-sm text-gray-600">
                บันทึกการเข้าร่วมฝึกซ้อม
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-6">
        <AttendanceSheetWrapper
          sessionId={params.sessionId}
          initialAthletes={athletes}
          initialSession={session}
        />
      </div>
    </div>
  );
}
