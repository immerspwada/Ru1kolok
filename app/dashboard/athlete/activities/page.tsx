import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActivityList } from '@/components/athlete/ActivityList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function AthleteActivitiesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get athlete profile
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, club_id')
    .eq('user_id', user.id)
    .single();

  if (!athlete) {
    return <div>ไม่พบข้อมูลนักกีฬา</div>;
  }

  // Get upcoming activities
  const { data: upcomingActivities } = await supabase
    .from('activities')
    .select(`
      *,
      coaches (first_name, last_name),
      activity_registrations!left (
        id,
        status,
        athlete_id
      ),
      activity_checkins!left (
        id,
        status,
        checked_in_at,
        checked_out_at,
        athlete_id
      )
    `)
    .eq('club_id', (athlete as any).club_id)
    .gte('activity_date', new Date().toISOString().split('T')[0])
    .order('activity_date', { ascending: true })
    .order('start_time', { ascending: true });

  // Get past activities
  const { data: pastActivities } = await supabase
    .from('activities')
    .select(`
      *,
      coaches (first_name, last_name),
      activity_checkins!left (
        id,
        status,
        checked_in_at,
        checked_out_at,
        athlete_id
      )
    `)
    .eq('club_id', (athlete as any).club_id)
    .lt('activity_date', new Date().toISOString().split('T')[0])
    .order('activity_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(20);

  // Get my registrations
  const { data: myRegistrations } = await supabase
    .from('activity_registrations')
    .select(`
      *,
      activities (
        *,
        coaches (first_name, last_name)
      )
    `)
    .eq('athlete_id', (athlete as any).id)
    .order('registered_at', { ascending: false });

  const upcomingCount = upcomingActivities?.length || 0;
  const registrationCount = myRegistrations?.length || 0;
  const pastCount = pastActivities?.length || 0;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header with Stats */}
      <div className="bg-gray-900 rounded-2xl shadow-sm p-6 mb-4 text-white">
        <h1 className="text-2xl font-bold mb-4">กิจกรรม</h1>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
            <p className="text-2xl font-bold">{upcomingCount}</p>
            <p className="text-xs text-gray-400 mt-1">กำลังมาถึง</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
            <p className="text-2xl font-bold">{registrationCount}</p>
            <p className="text-xs text-gray-400 mt-1">ลงทะเบียน</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
            <p className="text-2xl font-bold">{pastCount}</p>
            <p className="text-xs text-gray-400 mt-1">ผ่านมา</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white rounded-xl shadow-sm p-1 mb-4 border border-gray-200">
          <TabsTrigger value="upcoming" className="text-xs data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            กำลังมาถึง
          </TabsTrigger>
          <TabsTrigger value="registrations" className="text-xs data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            ลงทะเบียน
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            ผ่านมา
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-0">
          <ActivityList
            activities={upcomingActivities || []}
            athleteId={(athlete as any).id}
            type="upcoming"
          />
        </TabsContent>

        <TabsContent value="registrations" className="mt-0">
          <ActivityList
            activities={myRegistrations?.map((r: any) => r.activities) || []}
            athleteId={(athlete as any).id}
            registrations={myRegistrations || []}
            type="registrations"
          />
        </TabsContent>

        <TabsContent value="past" className="mt-0">
          <ActivityList
            activities={pastActivities || []}
            athleteId={(athlete as any).id}
            type="past"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
