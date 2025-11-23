/**
 * ActivityTimeline Component - Usage Examples
 * 
 * This file demonstrates various usage scenarios for the ActivityTimeline component.
 */

import ActivityTimeline from './ActivityTimeline';
import { ActivityLogEntry } from '@/types/database.types';

// Example 1: Complete application lifecycle
export function CompleteLifecycleExample() {
  const activityLog: ActivityLogEntry[] = [
    {
      timestamp: '2024-01-15T10:30:00Z',
      action: 'submitted',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        message: 'ส่งใบสมัครเข้าร่วมกีฬา',
      },
    },
    {
      timestamp: '2024-01-15T11:00:00Z',
      action: 'document_uploaded',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        document_type: 'id_card',
      },
    },
    {
      timestamp: '2024-01-15T11:05:00Z',
      action: 'document_uploaded',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        document_type: 'house_registration',
      },
    },
    {
      timestamp: '2024-01-15T11:10:00Z',
      action: 'document_uploaded',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        document_type: 'birth_certificate',
      },
    },
    {
      timestamp: '2024-01-16T14:20:00Z',
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'pending',
      to: 'approved',
      notes: 'เอกสารครบถ้วน ข้อมูลถูกต้อง อนุมัติเข้าร่วมทีม',
    },
    {
      timestamp: '2024-01-16T14:21:00Z',
      action: 'profile_created',
      by_user: 'system',
      by_role: 'admin',
      details: {
        profile_id: 'profile-789',
      },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Complete Application Lifecycle</h2>
      <ActivityTimeline activityLog={activityLog} />
    </div>
  );
}

// Example 2: Rejected application
export function RejectedApplicationExample() {
  const activityLog: ActivityLogEntry[] = [
    {
      timestamp: '2024-01-15T10:30:00Z',
      action: 'submitted',
      by_user: 'user-123',
      by_role: 'athlete',
    },
    {
      timestamp: '2024-01-16T09:15:00Z',
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'pending',
      to: 'rejected',
      notes: 'เอกสารไม่ครบถ้วน ขาดสูติบัตร กรุณาส่งเอกสารให้ครบและสมัครใหม่อีกครั้ง',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Rejected Application</h2>
      <ActivityTimeline activityLog={activityLog} />
    </div>
  );
}

// Example 3: Info requested workflow
export function InfoRequestedExample() {
  const activityLog: ActivityLogEntry[] = [
    {
      timestamp: '2024-01-15T10:30:00Z',
      action: 'submitted',
      by_user: 'user-123',
      by_role: 'athlete',
    },
    {
      timestamp: '2024-01-16T09:00:00Z',
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'pending',
      to: 'info_requested',
      notes: 'รูปบัตรประชาชนไม่ชัด กรุณาอัปโหลดรูปใหม่ที่มีความชัดเจนมากกว่านี้',
    },
    {
      timestamp: '2024-01-16T15:30:00Z',
      action: 'document_uploaded',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        document_type: 'id_card',
      },
    },
    {
      timestamp: '2024-01-17T10:00:00Z',
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'info_requested',
      to: 'approved',
      notes: 'เอกสารชัดเจนแล้ว อนุมัติ',
    },
    {
      timestamp: '2024-01-17T10:01:00Z',
      action: 'profile_created',
      by_user: 'system',
      by_role: 'admin',
      details: {
        profile_id: 'profile-999',
      },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Info Requested Workflow</h2>
      <ActivityTimeline activityLog={activityLog} />
    </div>
  );
}

// Example 4: Empty state
export function EmptyStateExample() {
  const activityLog: ActivityLogEntry[] = [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Empty Activity Log</h2>
      <ActivityTimeline activityLog={activityLog} />
    </div>
  );
}

// Example 5: Single entry
export function SingleEntryExample() {
  const activityLog: ActivityLogEntry[] = [
    {
      timestamp: new Date().toISOString(),
      action: 'submitted',
      by_user: 'user-123',
      by_role: 'athlete',
      details: {
        message: 'เพิ่งส่งใบสมัครเมื่อสักครู่',
      },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Single Entry (Just Submitted)</h2>
      <ActivityTimeline activityLog={activityLog} />
    </div>
  );
}

// Example 6: Admin override
export function AdminOverrideExample() {
  const activityLog: ActivityLogEntry[] = [
    {
      timestamp: '2024-01-15T10:30:00Z',
      action: 'submitted',
      by_user: 'user-123',
      by_role: 'athlete',
    },
    {
      timestamp: '2024-01-16T09:00:00Z',
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'pending',
      to: 'rejected',
      notes: 'อายุไม่ถึงเกณฑ์',
    },
    {
      timestamp: '2024-01-16T14:00:00Z',
      action: 'status_changed',
      by_user: 'admin-789',
      by_role: 'admin',
      from: 'rejected',
      to: 'approved',
      notes: 'Admin override: ได้รับการอนุมัติพิเศษจากผู้อำนวยการ',
    },
    {
      timestamp: '2024-01-16T14:01:00Z',
      action: 'profile_created',
      by_user: 'system',
      by_role: 'admin',
      details: {
        profile_id: 'profile-special',
      },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Override Scenario</h2>
      <ActivityTimeline activityLog={activityLog} />
    </div>
  );
}

// Example 7: Usage in a card
export function InCardExample() {
  const activityLog: ActivityLogEntry[] = [
    {
      timestamp: '2024-01-15T10:30:00Z',
      action: 'submitted',
      by_user: 'user-123',
      by_role: 'athlete',
    },
    {
      timestamp: '2024-01-16T14:20:00Z',
      action: 'status_changed',
      by_user: 'coach-456',
      by_role: 'coach',
      from: 'pending',
      to: 'approved',
      notes: 'อนุมัติ',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="rounded-lg border bg-gray-50 p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📋</span>
          ประวัติการดำเนินการ
        </h3>
        <ActivityTimeline activityLog={activityLog} />
      </div>
    </div>
  );
}
