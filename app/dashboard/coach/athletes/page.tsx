import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  email: string;
  phone_number?: string;
  gender?: string;
  profile_picture_url?: string;
}

export default async function CoachAthletesPage() {
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

  // Get all athletes in the same club
  const { data: athletes } = (await supabase
    .from('athletes')
    .select('*')
    .eq('club_id', (coach as any).club_id)
    .order('first_name', { ascending: true })) as { data: Athlete[] | null };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl p-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/coach"
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                รายชื่อนักกีฬา
              </h1>
              <p className="text-sm text-gray-600">
                นักกีฬาทั้งหมดในสโมสร
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl p-6">
        {athletes && athletes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {athletes.map((athlete) => (
              <div
                key={athlete.id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    {athlete.profile_picture_url ? (
                      <img
                        src={athlete.profile_picture_url}
                        alt={`${athlete.first_name} ${athlete.last_name}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {athlete.first_name} {athlete.last_name}
                    </h3>
                    {athlete.nickname && (
                      <p className="text-sm text-gray-600">
                        ({athlete.nickname})
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs">{athlete.email}</span>
                      </div>
                      {athlete.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{athlete.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              ยังไม่มีนักกีฬา
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              ยังไม่มีนักกีฬาในสโมสรของคุณ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
