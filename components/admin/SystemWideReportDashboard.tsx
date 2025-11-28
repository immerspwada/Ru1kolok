'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  generateSystemWideReport,
  exportSystemWideReportCSV,
  type SystemWideReportData,
} from '@/lib/admin/report-actions';
import { BarChart3, Users, Calendar, TrendingUp } from 'lucide-react';
import { ExportButton } from '@/components/coach/ExportButton';

export function SystemWideReportDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [clubs, setClubs] = useState<any[]>([]);
  const [reportData, setReportData] = useState<SystemWideReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Load clubs
  useEffect(() => {
    async function loadClubs() {
      try {
        const response = await fetch('/api/admin/clubs');
        if (response.ok) {
          const data = await response.json();
          setClubs(data.clubs || []);
        }
      } catch (err) {
        console.error('Failed to load clubs:', err);
      }
    }
    loadClubs();
  }, []);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('กรุณาเลือกช่วงวันที่');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await generateSystemWideReport({
      startDate,
      endDate,
      clubId: selectedClubId === 'all' ? undefined : selectedClubId,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      setReportData(null);
    } else {
      setReportData(result.data || null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            พารามิเตอร์รายงาน
          </CardTitle>
          <CardDescription>
            เลือกช่วงวันที่และสโมสรที่ต้องการดูรายงาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="club">สโมสร</Label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger id="club">
                  <SelectValue placeholder="เลือกสโมสร" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สโมสรทั้งหมด</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name} ({club.sport_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleGenerateReport} disabled={loading} className="w-full md:w-auto">
              {loading ? 'กำลังสร้างรายงาน...' : 'สร้างรายงาน'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {reportData && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">นักกีฬาทั้งหมด</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalAthletes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ตารางฝึกซ้อมทั้งหมด</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalSessions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">บันทึกการเข้าร่วม</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalAttendanceRecords}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อัตราเข้าร่วมเฉลี่ย</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.averageAttendanceRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Club Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>รายละเอียดตามสโมสร</CardTitle>
                  <CardDescription>
                    สถิติการเข้าร่วมแยกตามสโมสร
                  </CardDescription>
                </div>
                <ExportButton
                  onExportCSV={() =>
                    exportSystemWideReportCSV({
                      startDate,
                      endDate,
                      clubId: selectedClubId === 'all' ? undefined : selectedClubId,
                    })
                  }
                  filename="system_wide_report"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อสโมสร</TableHead>
                      <TableHead>ประเภทกีฬา</TableHead>
                      <TableHead className="text-center">จำนวนนักกีฬา</TableHead>
                      <TableHead className="text-center">จำนวนตารางฝึกซ้อม</TableHead>
                      <TableHead className="text-center">อัตราการเข้าร่วม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.clubBreakdown.map((club) => (
                      <TableRow key={club.clubId}>
                        <TableCell className="font-medium">{club.clubName}</TableCell>
                        <TableCell>{club.sportType}</TableCell>
                        <TableCell className="text-center">{club.athleteCount}</TableCell>
                        <TableCell className="text-center">{club.sessionCount}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-semibold ${
                              club.attendanceRate >= 80
                                ? 'text-green-600'
                                : club.attendanceRate >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {club.attendanceRate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!reportData && !loading && !error && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>กรุณาเลือกพารามิเตอร์และคลิก "สร้างรายงาน" เพื่อดูผลลัพธ์</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
