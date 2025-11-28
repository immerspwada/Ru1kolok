import { redirect } from 'next/navigation';
import { getParentSession } from '@/lib/parent-auth/actions';
import { ParentDashboard } from '@/components/parent/ParentDashboard';

export default async function ParentDashboardPage() {
  const session = await getParentSession();
  
  if (!session) {
    redirect('/parent/login');
  }

  return <ParentDashboard parentUser={session} />;
}
