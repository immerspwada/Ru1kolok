import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Calendar, TrendingUp, ClipboardList, FileText } from 'lucide-react';
import Link from 'next/link';

interface CoachProfile {
  id: string;
  first_name: string;
  last_name: string;
  specialization?: string;
  profile_picture_url?: string;
  clubs?: {
    id: string;
    name: string;
  };
}

export default async function CoachDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get coach profile
  const { data: profile, error: profileError } = (await supabase
    .from('coaches')
    .select(
      `
      *,
      clubs (id, name)
    `
    )
    .eq('user_id', user.id)
    .maybeSingle()) as { data: CoachProfile | null; error: any };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4 text-red-600">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            ไม่พบข้อมูลโค้ช
          </h2>
          <p className="text-gray-600 mb-6">
            ไม่พบข้อมูลโปรไฟล์โค้ชสำหรับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
          <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded">
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            {profileError && (
              <p className="text-red-600">
                <strong>Error:</strong> {profileError.message}
              </p>
            )}
          </div>
          <Link
            href="/logout"
            className="mt-6 inline-block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-center"
          >
            ออกจากระบบ
          </Link>
        </div>
      </div>
    );
  }

  // Get statistics
  const { count: totalAthletes } = await supabase
    .from('athletes')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', profile.clubs?.id || '');

  const { count: totalSessions } = await supabase
    .from('training_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', profile.clubs?.id || '');

  const { count: totalPerformanceRecords } = await supabase
    .from('performance_records')
    .select('*', { count: 'exact', head: true })
    .eq('coach_id', profile.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 shadow-lg">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                สวัสดี, โค้ช {profile.first_name}!
              </h1>
              <p className="text-green-100 text-sm mt-1">
                {profile.clubs?.name || 'โค้ช'}
                {profile.specialization && ` • ${profile.specialization}`}
              </p>
            </div>
            <Link
              href="/logout"
              className="rounded-lg p-3 hover:bg-white/10 transition-colors"
              title="ออกจากระบบ"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">นักกีฬาในสโมสร</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalAthletes || 0}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">การฝึกซ้อมทั้งหมด</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalSessions || 0}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">บันทึกผลการทดสอบ</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalPerformanceRecords || 0}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">เมนูด่วน</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Link
              href="/dashboard/coach/applications"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <FileText className="mb-3 h-8 w-8 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">ใบสมัครสมาชิก</h3>
              <p className="mt-1 text-sm text-gray-600">
                พิจารณาใบสมัครเข้าร่วมกีฬา
              </p>
            </Link>

            <Link
              href="/dashboard/coach/athletes"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <Users className="mb-3 h-8 w-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">จัดการนักกีฬา</h3>
              <p className="mt-1 text-sm text-gray-600">
                ดูและจัดการข้อมูลนักกีฬา
              </p>
            </Link>

            <Link
              href="/dashboard/coach/sessions"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <Calendar className="mb-3 h-8 w-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">ตารางฝึกซ้อม</h3>
              <p className="mt-1 text-sm text-gray-600">
                สร้างและจัดการตารางฝึกซ้อม
              </p>
            </Link>

            <Link
              href="/dashboard/coach/attendance"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <ClipboardList className="mb-3 h-8 w-8 text-orange-600" />
              <h3 className="font-semibold text-gray-900">เช็คชื่อ</h3>
              <p className="mt-1 text-sm text-gray-600">
                บันทึกการเข้าร่วมฝึกซ้อม
              </p>
            </Link>

            <Link
              href="/dashboard/coach/performance"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <TrendingUp className="mb-3 h-8 w-8 text-purple-600" />
              <h3 className="font-semibold text-gray-900">บันทึกผลการทดสอบ</h3>
              <p className="mt-1 text-sm text-gray-600">
                บันทึกและติดตามผลการทดสอบ
              </p>
            </Link>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ข้อมูลโค้ช
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600">ชื่อ-นามสกุล</p>
              <p className="mt-1 font-medium text-gray-900">
                {profile.first_name} {profile.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">สโมสร</p>
              <p className="mt-1 font-medium text-gray-900">
                {profile.clubs?.name || '-'}
              </p>
            </div>
            {profile.specialization && (
              <div>
                <p className="text-sm text-gray-600">ความเชี่ยวชาญ</p>
                <p className="mt-1 font-medium text-gray-900">
                  {profile.specialization}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
