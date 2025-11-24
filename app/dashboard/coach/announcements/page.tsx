import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateAnnouncementDialog } from '@/components/coach/CreateAnnouncementDialog';
import { AnnouncementList } from '@/components/coach/AnnouncementList';
import { CoachBottomNav } from '@/components/coach/CoachBottomNav';

export default async function CoachAnnouncementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get coach profile
  const { data: coach } = await supabase
    .from('coaches')
    .select('id, club_id, first_name, last_name')
    .eq('user_id', user.id)
    .single();

  if (!coach) {
    redirect('/dashboard/coach');
  }

  // Get announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('coach_id', coach?.id || '')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Native App Style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/coach"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-black" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-black">ประกาศแจ้งเตือน</h1>
                <p className="text-xs text-gray-500">
                  จัดการประกาศสำหรับนักกีฬา
                </p>
              </div>
            </div>
            <CreateAnnouncementDialog />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <AnnouncementList announcements={announcements || []} />
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-24"></div>

      {/* Bottom Navigation */}
      <CoachBottomNav />
    </div>
  );
}
