'use client';

import { useEffect, useState } from 'react';
import {
  getTournamentDetails,
  getAvailableAthletes,
  addAthleteToTournament,
  removeAthleteFromTournament,
  updateParticipantStatus,
} from '@/lib/coach/tournament-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, ArrowLeft, Search, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

export function TournamentManagement({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  async function loadData() {
    setLoading(true);
    const [detailsResult, athletesResult] = await Promise.all([
      getTournamentDetails(tournamentId),
      getAvailableAthletes(tournamentId),
    ]) as [any, any];

    if (detailsResult.tournament) {
      setTournament(detailsResult.tournament);
      setParticipants(detailsResult.participants || []);
    }

    if (athletesResult.athletes) {
      setAthletes(athletesResult.athletes);
    }

    setLoading(false);
  }

  async function handleAddAthlete(athleteId: string, status: 'selected' | 'waiting') {
    setAdding(athleteId);
    const result = await addAthleteToTournament(tournamentId, athleteId, status);
    if (result.error) {
      alert(result.error);
    } else {
      await loadData();
    }
    setAdding(null);
  }

  async function handleRemoveAthlete(athleteId: string) {
    const result = await removeAthleteFromTournament(tournamentId, athleteId);
    if (result.error) {
      alert(result.error);
    } else {
      await loadData();
    }
  }

  if (loading) {
    return <div className="text-center py-8">กำลังโหลด...</div>;
  }

  if (!tournament) {
    return <div className="text-center py-8">ไม่พบข้อมูลทัวร์นาเมนต์</div>;
  }

  const selectedParticipants = participants.filter(p => p.status === 'selected' || p.status === 'confirmed');
  const waitingParticipants = participants.filter(p => p.status === 'waiting');
  
  const availableAthletes = athletes.filter(a => !a.participantStatus);
  const filteredAthletes = availableAthletes.filter(a =>
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFull = tournament.max_participants && selectedParticipants.length >= tournament.max_participants;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        กลับ
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{tournament.name}</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{tournament.tournament_type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {new Date(tournament.start_date).toLocaleDateString('th-TH')} - {new Date(tournament.end_date).toLocaleDateString('th-TH')}
            </span>
          </div>
          {tournament.location && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{tournament.location}</span>
            </div>
          )}
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {selectedParticipants.length} คน
              {tournament.max_participants && ` / ${tournament.max_participants} คน`}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>นักกีฬาที่เลือก ({selectedParticipants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedParticipants.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  ยังไม่มีนักกีฬาที่เลือก
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedParticipants.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={p.athlete.profile_picture_url || undefined} />
                          <AvatarFallback>{p.athlete.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.athlete.full_name}</p>
                          <p className="text-sm text-muted-foreground">{p.athlete.email}</p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                            <AlertDialogDescription>
                              คุณแน่ใจหรือไม่ที่จะลบ "{p.athlete.full_name}" ออกจากทัวร์นาเมนต์?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveAthlete(p.athlete.id)}>
                              ลบ
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {waitingParticipants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>รายชื่อสำรอง ({waitingParticipants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {waitingParticipants.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={p.athlete.profile_picture_url || undefined} />
                          <AvatarFallback>{p.athlete.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{p.athlete.full_name}</p>
                          <p className="text-sm text-muted-foreground">{p.athlete.email}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveAthlete(p.athlete.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>เพิ่มนักกีฬา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหานักกีฬา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isFull && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ทัวร์นาเมนต์เต็มแล้ว คุณสามารถเพิ่มนักกีฬาในรายชื่อสำรองได้
              </div>
            )}

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredAthletes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'ไม่พบนักกีฬาที่ค้นหา' : 'ไม่มีนักกีฬาที่สามารถเพิ่มได้'}
                </p>
              ) : (
                filteredAthletes.map((athlete: any) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={athlete.profile_picture_url || undefined} />
                        <AvatarFallback>{athlete.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{athlete.full_name}</p>
                        <p className="text-sm text-muted-foreground">{athlete.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddAthlete(athlete.id, 'selected')}
                        disabled={adding === athlete.id || isFull}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        เลือก
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddAthlete(athlete.id, 'waiting')}
                        disabled={adding === athlete.id}
                      >
                        สำรอง
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
