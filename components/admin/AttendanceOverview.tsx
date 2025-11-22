'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, TrendingUp, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';

interface SystemAttendanceStats {
  totalSessions: number;
  totalAttendanceRecords: number;
  averageAttendanceRate: number;
  activeAthletes: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
}

interface AttendanceOverviewProps {
  stats: SystemAttendanceStats;
}

export function AttendanceOverview({ stats }: AttendanceOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ตารางฝึกซ้อมทั้งหมด</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ครั้ง</p>
          </CardContent>
        </Card>

        {/* Average Attendance Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราการเข้าร่วมเฉลี่ย</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttendanceRate.toFixed(1)}%</div>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${stats.averageAttendanceRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Athletes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">นักกีฬาที่เข้าร่วม</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAthletes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">คน</p>
          </CardContent>
        </Card>

        {/* Total Attendance Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บันทึกการเข้าร่วม</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendanceRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>สถิติการเข้าร่วมแยกตามสถานะ</CardTitle>
          <CardDescription>รายละเอียดการเข้าร่วมของนักกีฬาทั้งหมด</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Present */}
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">เข้าร่วม</p>
                <p className="text-2xl font-bold">{stats.presentCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAttendanceRecords > 0
                    ? `${((stats.presentCount / stats.totalAttendanceRecords) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {/* Absent */}
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <div className="rounded-full bg-red-100 p-2">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ขาด</p>
                <p className="text-2xl font-bold">{stats.absentCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAttendanceRecords > 0
                    ? `${((stats.absentCount / stats.totalAttendanceRecords) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {/* Excused */}
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <div className="rounded-full bg-blue-100 p-2">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ลา</p>
                <p className="text-2xl font-bold">{stats.excusedCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAttendanceRecords > 0
                    ? `${((stats.excusedCount / stats.totalAttendanceRecords) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {/* Late */}
            <div className="flex items-center space-x-4 rounded-lg border p-4">
              <div className="rounded-full bg-yellow-100 p-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">สาย</p>
                <p className="text-2xl font-bold">{stats.lateCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalAttendanceRecords > 0
                    ? `${((stats.lateCount / stats.totalAttendanceRecords) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
