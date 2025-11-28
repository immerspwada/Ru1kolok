import { Suspense } from 'react';
import { SystemWideReportDashboard } from '@/components/admin/SystemWideReportDashboard';

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">รายงานระบบ</h1>
        <p className="mt-2 text-sm md:text-base text-gray-600">
          ดูรายงานและสถิติของระบบทั้งหมด
        </p>
      </div>

      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <SystemWideReportDashboard />
      </Suspense>
    </div>
  );
}
