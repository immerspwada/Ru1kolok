'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Activity,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getProgressReport } from '@/lib/progress/actions';
import PerformanceChart from './PerformanceChart';
import AttendanceChart from './AttendanceChart';

interface ProgressReportDetailProps {
  reportId: string;
}

export default function ProgressReportDetail({ reportId }: ProgressReportDetailProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      const result = await getProgressReport(reportId);
      if (result.success) {
        setReport(result.data);
      }
      setLoading(false);
    }
    loadReport();
  }, [reportId]);

  if (loading) {
    return <div className="text-center py-8">กำลังโหลดรายงาน...</div>;
  }

  if (!report) {
    return <div className="text-center py-8">ไม่พบรายงาน</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const metrics = report.metrics || {};
  const attendance = metrics.attendance || {};
  const performance = metrics.performance || {};
  const goals = metrics.goals || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{report.title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    โดย โค้ช {report.coaches?.first_name} {report.coaches?.last_name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(report.period_start)} - {formatDate(report.period_end)}
                  </span>
                </div>
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด PDF
            </Button>
          </div>
        </CardHeader>
        {report.summary && (
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">สรุปภาพรวม</h3>
              <p className="text-sm text-muted-foreground">{report.summary}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Attendance Metric */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              การเข้าฝึกซ้อม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {attendance.attendance_rate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              เข้าฝึก {attendance.attended_sessions || 0} จาก {attendance.total_sessions || 0} ครั้ง
            </p>
            {attendance.late_count > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                มาสาย {attendance.late_count} ครั้ง
              </p>
            )}
          </CardContent>
        </Card>

        {/* Performance Metric */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ผลการทดสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {performance.avg_score?.toFixed(1) || '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              คะแนนเฉลี่ย ({performance.tests_count || 0} การทดสอบ)
            </p>
            {performance.best_score && (
              <p className="text-xs text-green-600 mt-1">
                คะแนนสูงสุด: {performance.best_score.toFixed(1)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Goals Metric */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เป้าหมาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {goals.completed_count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              สำเร็จจาก {(goals.active_count || 0) + (goals.completed_count || 0)} เป้าหมาย
            </p>
            {goals.avg_progress > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                ความคืบหน้าเฉลี่ย: {goals.avg_progress.toFixed(0)}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {report.charts_data && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Performance Trend Chart */}
          {report.charts_data.performance_trend?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">กราฟพัฒนาการผลการทดสอบ</CardTitle>
                <CardDescription>แสดงผลการทดสอบในช่วงเวลาที่กำหนด</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={report.charts_data.performance_trend} />
              </CardContent>
            </Card>
          )}

          {/* Attendance Trend Chart */}
          {report.charts_data.attendance_trend?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">กราฟการเข้าฝึกซ้อม</CardTitle>
                <CardDescription>แสดงสถิติการเข้าฝึกซ้อม</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceChart data={report.charts_data.attendance_trend} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Highlights */}
      {report.highlights && report.highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              จุดเด่น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.highlights.map((highlight: string, index: number) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Areas for Improvement */}
      {report.areas_for_improvement && report.areas_for_improvement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              จุดที่ควรพัฒนา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.areas_for_improvement.map((area: string, index: number) => (
                <li key={index} className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Coach Comments */}
      {report.coach_comments && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ความคิดเห็นจากโค้ช</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{report.coach_comments}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground text-center">
            รายงานนี้สร้างเมื่อ {formatDate(report.published_at || report.created_at)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
