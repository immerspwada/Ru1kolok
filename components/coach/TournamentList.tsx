'use client';

import { useEffect, useState } from 'react';
import { getCoachTournaments } from '@/lib/coach/tournament-actions';
import { TournamentCard } from './TournamentCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TournamentList() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  async function loadTournaments() {
    setLoading(true);
    const result = await getCoachTournaments();
    if (result.tournaments) {
      setTournaments(result.tournaments);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-8">กำลังโหลด...</div>;
  }

  const upcoming = tournaments.filter(t => t.status === 'upcoming');
  const ongoing = tournaments.filter(t => t.status === 'ongoing');
  const completed = tournaments.filter(t => t.status === 'completed');

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList>
        <TabsTrigger value="upcoming">
          กำลังจะมาถึง ({upcoming.length})
        </TabsTrigger>
        <TabsTrigger value="ongoing">
          กำลังดำเนินการ ({ongoing.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          เสร็จสิ้น ({completed.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="space-y-4 mt-6">
        {upcoming.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            ไม่มีทัวร์นาเมนต์ที่กำลังจะมาถึง
          </p>
        ) : (
          upcoming.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} onUpdate={loadTournaments} />
          ))
        )}
      </TabsContent>

      <TabsContent value="ongoing" className="space-y-4 mt-6">
        {ongoing.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            ไม่มีทัวร์นาเมนต์ที่กำลังดำเนินการ
          </p>
        ) : (
          ongoing.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} onUpdate={loadTournaments} />
          ))
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4 mt-6">
        {completed.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            ไม่มีทัวร์นาเมนต์ที่เสร็จสิ้น
          </p>
        ) : (
          completed.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} onUpdate={loadTournaments} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
