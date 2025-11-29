import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ParentDashboard } from '@/components/parent/ParentDashboard';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('parent_session')?.value;
  
  if (!sessionToken) {
    redirect('/parent/login');
  }

  // Verify session is still valid
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  
  const { data: session, error } = await sb
    .from('parent_sessions')
    .select('*, parent_users(*)')
    .eq('session_token', sessionToken)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !session) {
    redirect('/parent/login');
  }

  return <ParentDashboard parentUser={{
    id: session.parent_users.id,
    email: session.parent_users.email,
    last_login_at: session.parent_users.last_login_at,
    login_count: session.parent_users.login_count,
  }} />;
}
