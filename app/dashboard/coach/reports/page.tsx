import { Suspense } from 'react';
import { AttendanceReportGenerator } from '@/components/coach/AttendanceReportGenerator';
import { PerformanceDataExport } from '@/components/coach/PerformanceDataExport';

export default function CoachReportsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">รายงานและส่งออกข้อมูล</h1>
        <p className="mt-2 text-sm md:text-base text-gray-600">
          สร้างรายงานและส่งออกข้อมูลการเข้าร่วมและผลการทดสอบของนักกีฬาในสโมสร
        </p>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<div>กำลังโหลด...</div>}>
          <AttendanceReportGenerator />
        </Suspense>

        <Suspense fallback={<div>กำลังโหลด...</div>}>
          <PerformanceDataExport />
        </Suspense>
      </div>
    </div>
  );
}
