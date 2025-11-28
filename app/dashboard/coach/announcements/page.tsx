import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateAnnouncementDialog } from '@/components/coach/CreateAnnouncementDialog';
import { AnnouncementList } from '@/components/coach/AnnouncementList';
import { CoachBottomNav } from '@/components/coach/CoachBottomNav';

interface CoachProfile {
  id: string;
  club_id: string | null;
  first_name: string;
  last_name: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export default async function CoachAnnouncementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get coach profile
  const { data: coach } = (await supabase
    .from('coaches')
    .select('id, club_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()) as { data: CoachProfile | null };

  if (!coach) {
    redirect('/dashboard/coach');
  }

  // Get announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('coach_id', coach.id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  // Get read counts for each announcement
  const announcementsWithReads = await Promise.all(
    (announcements || []).map(async (announcement: Announcement) => {
      const { count } = await supabase
        .from('announcement_reads')
        .select('*', { count: 'exact', head: true })
        .eq('announcement_id', announcement.id);
      
      return {
        ...announcement,
        read_count: count || 0,
      };
    })
  );

  // Get total athletes count in the club
  const { count: totalAthletes } = await supabase
    .from('athletes')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', coach.club_id || '');

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

      {/* Stats Summary */}
      {announcementsWithReads && announcementsWithReads.length > 0 && (
        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">ทั้งหมด</p>
              <p className="text-2xl font-bold text-black">{announcementsWithReads.length}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">ปักหมุด</p>
              <p className="text-2xl font-bold text-black">
                {announcementsWithReads.filter((a: any) => a.is_pinned).length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">นักกีฬา</p>
              <p className="text-2xl font-bold text-black">{totalAthletes || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-6">
        <AnnouncementList 
          announcements={announcementsWithReads || []} 
          totalAthletes={totalAthletes || 0}
        />
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-24"></div>

      {/* Bottom Navigation */}
      <CoachBottomNav />
    </div>
  );
}
