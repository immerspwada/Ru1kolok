import { Suspense } from 'react';
import { CoachHomeTrainingList } from '@/components/coach/CoachHomeTrainingList';

export default function CoachHomeTrainingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ตรวจสอบการฝึกที่บ้าน</h1>
        <p className="text-muted-foreground">ตรวจสอบและให้ feedback การฝึกเสริมของนักกีฬา</p>
      </div>

      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <CoachHomeTrainingList />
      </Suspense>
    </div>
  );
}
