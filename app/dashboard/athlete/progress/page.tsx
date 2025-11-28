import { Suspense } from 'react';
import { getMyProgressReports } from '@/lib/progress/actions';
import ProgressReportsList from '@/components/athlete/ProgressReportsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'รายงานความก้าวหน้า | ระบบจัดการสโมสรกีฬา',
  description: 'ดูรายงานความก้าวหน้าและพัฒนาการของคุณ',
};

export default async function AthleteProgressPage() {
  const result = await getMyProgressReports();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">รายงานความก้าวหน้า</h1>
        <p className="text-muted-foreground mt-2">
          ดูรายงานความก้าวหน้าและพัฒนาการของคุณที่โค้ชจัดทำให้
        </p>
      </div>

      {result.success && result.data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>ยังไม่มีรายงาน</CardTitle>
            <CardDescription>
              โค้ชของคุณยังไม่ได้สร้างรายงานความก้าวหน้า
              รายงานจะปรากฏที่นี่เมื่อโค้ชสร้างและเผยแพร่แล้ว
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Suspense fallback={<div>กำลังโหลด...</div>}>
          <ProgressReportsList reports={result.data || []} />
        </Suspense>
      )}
    </div>
  );
}
