'use client';

import { useState, useCallback } from 'react';
import { AttendanceSheet } from './AttendanceSheet';
import { Users } from 'lucide-react';
import { Database } from '@/types/database.types';
import { useRouter } from 'next/navigation';

type AttendanceLog = Database['public']['Tables']['attendance']['Row'];

interface AthleteWithAttendance {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  attendance?: AttendanceLog;
}

interface AttendanceSheetWrapperProps {
  sessionId: string;
  initialAthletes: AthleteWithAttendance[];
  initialSession: any;
}

export function AttendanceSheetWrapper({
  sessionId,
  initialAthletes,
  initialSession,
}: AttendanceSheetWrapperProps) {
  const router = useRouter();
  const [athletes] = useState(initialAthletes);

  // Handle refresh after attendance update
  const handleUpdate = useCallback(() => {
    // Refresh the page data
    router.refresh();
  }, [router]);

  // Calculate attendance summary
  const presentCount = athletes.filter((a) => a.attendance?.status === 'present').length;
  const absentCount = athletes.filter((a) => a.attendance?.status === 'absent').length;
  const excusedCount = athletes.filter((a) => a.attendance?.status === 'excused').length;
  const lateCount = athletes.filter((a) => a.attendance?.status === 'late').length;
  const unmarkedCount = athletes.filter((a) => !a.attendance).length;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content - Attendance Sheet */}
      <div className="lg:col-span-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">รายชื่อนักกีฬา</h2>
          <AttendanceSheet
            sessionId={sessionId}
            athletes={athletes}
            onUpdate={handleUpdate}
          />
        </div>
      </div>

      {/* Sidebar - Session Info & Summary */}
      <div className="space-y-6">
        {/* Session Information */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">ข้อมูลการฝึกซ้อม</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {initialSession.session_name || 'ฝึกซ้อม'}
              </h3>
              {initialSession.session_type && (
                <p className="text-xs text-gray-600 mt-1">
                  ประเภท: {initialSession.session_type}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-900">
                  {initialSession.session_date
                    ? new Date(initialSession.session_date).toLocaleDateString('th-TH', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'ไม่ระบุวันที่'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-900">
                  {initialSession.start_time || 'ไม่ระบุ'} - {initialSession.end_time || 'ไม่ระบุ'}
                </p>
              </div>
            </div>

            {initialSession.location && (
              <div className="flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-900">{initialSession.location}</p>
                </div>
              </div>
            )}

            {initialSession.description && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">{initialSession.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">สรุปการเข้าร่วม</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">ทั้งหมด</span>
              </div>
              <span className="text-sm font-medium">{athletes.length} คน</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">เข้าร่วม</span>
              </div>
              <span className="text-sm font-medium text-green-600">{presentCount} คน</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-600">สาย</span>
              </div>
              <span className="text-sm font-medium text-yellow-600">{lateCount} คน</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">ลา</span>
              </div>
              <span className="text-sm font-medium text-blue-600">{excusedCount} คน</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">ขาด</span>
              </div>
              <span className="text-sm font-medium text-red-600">{absentCount} คน</span>
            </div>

            {unmarkedCount > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-600">ยังไม่ได้เช็ค</span>
                </div>
                <span className="text-sm font-medium text-gray-600">{unmarkedCount} คน</span>
              </div>
            )}

            {/* Attendance Rate */}
            {athletes.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">อัตราการเข้าร่วม</span>
                  <span className="text-sm font-medium">
                    {Math.round(((presentCount + lateCount) / athletes.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${((presentCount + lateCount) / athletes.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 เคล็ดลับ</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• เลือกสถานะจากเมนูด้านขวาของแต่ละคน</li>
            <li>• ระบบจะบันทึกอัตโนมัติทันทีที่เปลี่ยนสถานะ</li>
            <li>• สามารถเพิ่มหมายเหตุได้ตามต้องการ</li>
            <li>• ใช้ช่องค้นหาเพื่อหานักกีฬาได้เร็วขึ้น</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
