'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, CheckCircle } from 'lucide-react';

interface ClubStats {
  clubId: string;
  clubName: string;
  sportType: string;
  totalSessions: number;
  totalAttendanceRecords: number;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  activeAthletes: number;
}

interface ClubStatsTableProps {
  clubStats: ClubStats[];
}

export function ClubStatsTable({ clubStats }: ClubStatsTableProps) {
  // Get performance badge color based on attendance rate
  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 75) return 'bg-blue-100 text-blue-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Get performance label
  const getPerformanceLabel = (rate: number) => {
    if (rate >= 90) return 'ดีเยี่ยม';
    if (rate >= 75) return 'ดี';
    if (rate >= 60) return 'ปานกลาง';
    return 'ต้องปรับปรุง';
  };

  if (clubStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>สถิติแยกตามสโมสร</CardTitle>
          <CardDescription>ไม่มีข้อมูลสถิติ</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            ยังไม่มีข้อมูลการฝึกซ้อมในระบบ
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>สถิติแยกตามสโมสร</CardTitle>
        <CardDescription>
          เปรียบเทียบประสิทธิภาพการเข้าร่วมฝึกซ้อมของแต่ละสโมสร (เรียงตามอัตราการเข้าร่วม)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">อันดับ</TableHead>
                <TableHead>ชื่อสโมสร</TableHead>
                <TableHead>ประเภทกีฬา</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>อัตราการเข้าร่วม</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>ตารางฝึกซ้อม</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>นักกีฬาที่เข้าร่วม</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>สถานะ</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubStats.map((club, index) => (
                <TableRow key={club.clubId}>
                  {/* Rank */}
                  <TableCell className="text-center font-bold">
                    {index === 0 && <span className="text-yellow-500">🥇</span>}
                    {index === 1 && <span className="text-gray-400">🥈</span>}
                    {index === 2 && <span className="text-orange-600">🥉</span>}
                    {index > 2 && <span className="text-muted-foreground">{index + 1}</span>}
                  </TableCell>

                  {/* Club Name */}
                  <TableCell className="font-medium">{club.clubName}</TableCell>

                  {/* Sport Type */}
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {club.sportType}
                    </span>
                  </TableCell>

                  {/* Attendance Rate */}
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-bold">{club.attendanceRate.toFixed(1)}%</span>
                      <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            club.attendanceRate >= 90
                              ? 'bg-green-500'
                              : club.attendanceRate >= 75
                              ? 'bg-blue-500'
                              : club.attendanceRate >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${club.attendanceRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {club.presentCount + club.lateCount}/{club.totalAttendanceRecords}
                      </span>
                    </div>
                  </TableCell>

                  {/* Total Sessions */}
                  <TableCell className="text-center">
                    <span className="text-lg font-semibold">{club.totalSessions}</span>
                    <span className="text-xs text-muted-foreground block">ครั้ง</span>
                  </TableCell>

                  {/* Active Athletes */}
                  <TableCell className="text-center">
                    <span className="text-lg font-semibold">{club.activeAthletes}</span>
                    <span className="text-xs text-muted-foreground block">คน</span>
                  </TableCell>

                  {/* Performance Badge */}
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPerformanceBadge(
                        club.attendanceRate
                      )}`}
                    >
                      {getPerformanceLabel(club.attendanceRate)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">สโมสรทั้งหมด</p>
            <p className="text-2xl font-bold">{clubStats.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">อัตราเฉลี่ยทั้งระบบ</p>
            <p className="text-2xl font-bold">
              {clubStats.length > 0
                ? (
                    clubStats.reduce((sum, club) => sum + club.attendanceRate, 0) / clubStats.length
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">นักกีฬาทั้งหมด</p>
            <p className="text-2xl font-bold">
              {clubStats.reduce((sum, club) => sum + club.activeAthletes, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
