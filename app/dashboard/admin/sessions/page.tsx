import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SessionsTable } from '@/components/admin/SessionsTable';
import { getAllSessions } from '@/lib/admin/attendance-actions';

export default async function AdminSessionsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Verify user is admin
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  // @ts-ignore - Supabase type inference issue
  if (roleError || !userRole || userRole.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch all sessions
  const { data: sessions, error: sessionsError } = await getAllSessions();

  if (sessionsError) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">เกิดข้อผิดพลาด: {sessionsError}</p>
        </div>
      </div>
    );
  }

  // Fetch all clubs for filter dropdown
  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('id, name')
    .order('name');

  if (clubsError) {
    console.error('Error fetching clubs:', clubsError);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">จัดการตารางฝึกซ้อม</h1>
        <p className="text-muted-foreground mt-2">
          ดูและจัดการตารางฝึกซ้อมทั้งหมดในระบบ
        </p>
      </div>

      <SessionsTable sessions={sessions || []} clubs={clubs || []} />
    </div>
  );
}
