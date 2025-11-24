import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Building2, UserCog, Calendar, Shield } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get statistics
  const { count: totalAthletes } = await supabase
    .from('athletes')
    .select('*', { count: 'exact', head: true });

  const { count: totalCoaches } = await supabase
    .from('coaches')
    .select('*', { count: 'exact', head: true });

  const { count: totalClubs } = await supabase
    .from('clubs')
    .select('*', { count: 'exact', head: true });

  const { count: totalSessions } = await supabase
    .from('training_sessions')
    .select('*', { count: 'exact', head: true });

  const stats = {
    totalUsers: (totalAthletes || 0) + (totalCoaches || 0),
    totalClubs: totalClubs || 0,
    totalAthletes: totalAthletes || 0,
    totalCoaches: totalCoaches || 0,
    recentActivities: totalSessions || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 shadow-lg">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-white/20 p-3">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
                <p className="text-indigo-100 text-sm mt-1">
                  ยินดีต้อนรับสู่ระบบจัดการสโมสรกีฬา
                </p>
              </div>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="ผู้ใช้ทั้งหมด"
            value={stats.totalUsers}
            icon={Users}
            description="นักกีฬาและโค้ชรวมกัน"
          />
          <StatCard
            title="สโมสรทั้งหมด"
            value={stats.totalClubs}
            icon={Building2}
            description="สโมสรกีฬาที่ใช้งานอยู่"
          />
          <StatCard
            title="นักกีฬา"
            value={stats.totalAthletes}
            icon={Users}
            description="นักกีฬาที่ลงทะเบียน"
          />
          <StatCard
            title="โค้ช"
            value={stats.totalCoaches}
            icon={UserCog}
            description="โค้ชที่ใช้งานอยู่"
          />
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                กิจกรรมล่าสุด
              </h2>
            </div>
            <p className="text-gray-600">
              {stats.recentActivities} เซสชั่นการฝึกซ้อมทั้งหมด
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">เมนูด่วน</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/dashboard/admin/clubs"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <Building2 className="mb-2 h-8 w-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">จัดการสโมสร</h3>
              <p className="mt-1 text-sm text-gray-600">
                สร้างและจัดการสโมสรกีฬา
              </p>
            </Link>
            <Link
              href="/dashboard/admin/coaches"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <UserCog className="mb-2 h-8 w-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">จัดการโค้ช</h3>
              <p className="mt-1 text-sm text-gray-600">
                เพิ่มและมอบหมายโค้ชให้กับสโมสร
              </p>
            </Link>
            <Link
              href="/dashboard/admin/reports"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <Calendar className="mb-2 h-8 w-8 text-purple-600" />
              <h3 className="font-semibold text-gray-900">ดูรายงาน</h3>
              <p className="mt-1 text-sm text-gray-600">สร้างรายงานทั้งระบบ</p>
            </Link>
            <Link
              href="/dashboard/admin/rate-limits"
              className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
            >
              <Shield className="mb-2 h-8 w-8 text-orange-600" />
              <h3 className="font-semibold text-gray-900">จัดการ Rate Limiting</h3>
              <p className="mt-1 text-sm text-gray-600">ปลดล็อกผู้ใช้ที่ถูกบล็อก</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
