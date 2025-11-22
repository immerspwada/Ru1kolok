import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { getCoachSessions } from '@/lib/coach/session-actions';
import { SessionList } from '@/components/coach/SessionList';
import { CreateSessionDialog } from '@/components/coach/CreateSessionDialog';

export default async function CoachSessionsPage() {
  const supabase = await createClient();

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

  // Fetch sessions
  const { data: sessions, error: sessionsError } = await getCoachSessions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/coach"
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ตารางฝึกซ้อม
                </h1>
                <p className="text-sm text-gray-600">
                  สร้างและจัดการตารางการฝึกซ้อม
                </p>
              </div>
            </div>
            
            {/* Create Session Button */}
            <CreateSessionDialog />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-6">
        {sessionsError ? (
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-600">{sessionsError}</p>
          </div>
        ) : (
          <SessionList sessions={sessions || []} />
        )}
      </div>
    </div>
  );
}
