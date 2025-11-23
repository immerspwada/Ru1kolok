'use client';

import ActivityTimeline from '@/components/membership/ActivityTimeline';
import { ActivityLogEntry } from '@/types/database.types';
import { Card } from '@/components/ui/card';

export default function TestActivityTimelinePage() {
  // Sample activity log data
  const sampleActivityLog: ActivityLogEntry[] = [
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      action: 'submitted',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        message: 'ส่งใบสมัครเข้าร่วมกีฬา',
      },
    },
    {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      action: 'document_uploaded',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        document_type: 'id_card',
      },
    },
    {
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'pending',
      to: 'approved',
      notes: 'เอกสารครบถ้วน ข้อมูลถูกต้อง',
    },
    {
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 1 day ago
      action: 'profile_created',
      by_user: 'system',
      by_role: 'admin',
      details: {
        profile_id: 'profile-789',
      },
    },
    {
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'pending',
      to: 'info_requested',
      notes: 'กรุณาอัปโหลดรูปบัตรประชาชนที่ชัดเจนกว่านี้',
    },
  ];

  const emptyActivityLog: ActivityLogEntry[] = [];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Activity Timeline Component Test</h1>

      <div className="space-y-8">
        {/* Test with sample data */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">With Activity Log Data</h2>
          <ActivityTimeline activityLog={sampleActivityLog} />
        </Card>

        {/* Test with empty data */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Empty Activity Log</h2>
          <ActivityTimeline activityLog={emptyActivityLog} />
        </Card>

        {/* Test with single entry */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Single Entry</h2>
          <ActivityTimeline activityLog={[sampleActivityLog[0]]} />
        </Card>

        {/* Test with rejected status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Rejected Application</h2>
          <ActivityTimeline
            activityLog={[
              {
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                action: 'submitted',
                by_user: 'user-123',
                by_role: 'athlete',
              },
              {
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                action: 'status_changed',
                by_user: 'coach-456',
                by_role: 'coach',
                from: 'pending',
                to: 'rejected',
                notes: 'เอกสารไม่ครบถ้วน กรุณาส่งเอกสารใหม่',
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
