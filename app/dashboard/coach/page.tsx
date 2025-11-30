import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  ClipboardList, 
  FileText,
  Activity,
  BarChart3,
  UserCheck,
  Settings,
  Bell,
  ChevronRight,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { CoachBottomNav } from '@/components/coach/CoachBottomNav';

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
    <div className="min-h-screen bg-black">
      {/* Native App Header - Black & White */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {profile.first_name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-black">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-xs text-gray-500">
                  {profile.clubs?.name || 'โค้ช'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="h-5 w-5 text-black" />
              </button>
              <Link
                href="/logout"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="h-5 w-5 text-black" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen">
        {/* Stats Overview - Compact Cards */}
        <div className="bg-white px-4 py-6 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-black flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-black">{totalAthletes || 0}</p>
              <p className="text-xs text-gray-500 mt-1">นักกีฬา</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-black flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-black">{totalSessions || 0}</p>
              <p className="text-xs text-gray-500 mt-1">การฝึกซ้อม</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-black flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-black">{totalPerformanceRecords || 0}</p>
              <p className="text-xs text-gray-500 mt-1">ผลทดสอบ</p>
            </div>
          </div>
        </div>

        {/* Category Sections */}
        <div className="px-4 py-6 space-y-6">
          {/* การจัดการสมาชิก */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
              การจัดการสมาชิก
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <Link
                href="/dashboard/coach/announcements"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">สร้างประกาศ</p>
                    <p className="text-xs text-gray-500">ประกาศข่าวสารให้นักกีฬา</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/coach/applications"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">พิจารณาใบสมัคร</p>
                    <p className="text-xs text-gray-500">อนุมัติ/ปฏิเสธใบสมัครสมาชิก</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/coach/athletes"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">รายชื่อนักกีฬา</p>
                    <p className="text-xs text-gray-500">ดูข้อมูลและจัดการนักกีฬา</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* การฝึกซ้อม */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
              การฝึกซ้อม
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <Link
                href="/dashboard/coach/sessions"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">สร้างตารางฝึก</p>
                    <p className="text-xs text-gray-500">กำหนดวันเวลาฝึกซ้อม</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/coach/activities"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">สร้างกิจกรรม</p>
                    <p className="text-xs text-gray-500">สร้างกิจกรรมพิเศษ/QR Check-in</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/coach/tournaments"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">จัดการทัวร์นาเมนต์</p>
                    <p className="text-xs text-gray-500">เลือกนักกีฬาเข้าแข่งขัน</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/coach/attendance"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">บันทึกการเข้าร่วม</p>
                    <p className="text-xs text-gray-500">เช็คชื่อนักกีฬา</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* การประเมินผล */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
              การประเมินผล
            </h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <Link
                href="/dashboard/coach/performance"
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-black">บันทึกผลทดสอบ</p>
                    <p className="text-xs text-gray-500">บันทึกและติดตามพัฒนาการ</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-5 w-5 text-black" />
              <h3 className="font-semibold text-black">ข้อมูลโค้ช</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">สโมสร</span>
                <span className="font-medium text-black">{profile.clubs?.name || '-'}</span>
              </div>
              {profile.specialization && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ความเชี่ยวชาญ</span>
                  <span className="font-medium text-black">{profile.specialization}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Spacing for Mobile Navigation */}
        <div className="h-24"></div>
      </div>

      {/* Bottom Navigation */}
      <CoachBottomNav />
    </div>
  );
}
