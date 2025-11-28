import { Suspense } from 'react';
import Link from 'next/link';
import { TournamentList } from '@/components/coach/TournamentList';
import { CreateTournamentDialog } from '@/components/coach/CreateTournamentDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TournamentsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Link href="/dashboard/coach">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ทัวร์นาเมนต์</h1>
          <p className="text-muted-foreground mt-1">
            จัดการทัวร์นาเมนต์และเลือกนักกีฬาเข้าร่วม
          </p>
        </div>
        <CreateTournamentDialog />
      </div>

      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <TournamentList />
      </Suspense>
    </div>
  );
}
