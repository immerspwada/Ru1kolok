'use client';

import { deleteTournament } from '@/lib/coach/tournament-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function TournamentCard({ tournament, onUpdate }: any) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const statusColors: any = {
    upcoming: 'bg-blue-500',
    ongoing: 'bg-green-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500',
  };

  const statusLabels: any = {
    upcoming: 'กำลังจะมาถึง',
    ongoing: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
  };

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteTournament(tournament.id);
    if (result.success) {
      onUpdate();
    } else {
      alert(result.error);
    }
    setDeleting(false);
  }

  const participantCount = tournament.tournament_participants?.[0]?.count || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{tournament.name}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={statusColors[tournament.status]}>
                {statusLabels[tournament.status]}
              </Badge>
              <Badge variant="outline">{tournament.tournament_type}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/coach/tournaments/${tournament.id}`)}
            >
              <Users className="h-4 w-4 mr-1" />
              จัดการนักกีฬา
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณแน่ใจหรือไม่ที่จะลบทัวร์นาเมนต์ "{tournament.name}"?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>ลบ</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date(tournament.start_date).toLocaleDateString('th-TH')} - {new Date(tournament.end_date).toLocaleDateString('th-TH')}
        </div>
        {tournament.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            {tournament.location}
          </div>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-2" />
          นักกีฬา: {participantCount} คน
          {tournament.max_participants && ` / ${tournament.max_participants} คน`}
        </div>
        {tournament.notes && (
          <p className="text-sm text-muted-foreground mt-2">{tournament.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
