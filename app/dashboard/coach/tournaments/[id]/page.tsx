import { Suspense } from 'react';
import { TournamentManagement } from '@/components/coach/TournamentManagement';

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <TournamentManagement tournamentId={params.id} />
      </Suspense>
    </div>
  );
}
