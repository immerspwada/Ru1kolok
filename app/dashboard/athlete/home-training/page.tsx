import { Suspense } from 'react';
import { HomeTrainingList } from '@/components/athlete/HomeTrainingList';
import { CreateHomeTrainingDialog } from '@/components/athlete/CreateHomeTrainingDialog';
import { HomeTrainingStats } from '@/components/athlete/HomeTrainingStats';

export default function HomeTrainingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">การฝึกที่บ้าน</h1>
          <p className="text-muted-foreground">บันทึกและติดตามการฝึกเสริมที่บ้าน</p>
        </div>
        <CreateHomeTrainingDialog />
      </div>

      <Suspense fallback={<div>กำลังโหลดสถิติ...</div>}>
        <HomeTrainingStats />
      </Suspense>

      <Suspense fallback={<div>กำลังโหลดประวัติการฝึก...</div>}>
        <HomeTrainingList />
      </Suspense>
    </div>
  );
}
