'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHomeTrainingStats } from '@/lib/athlete/home-training-actions';
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function HomeTrainingStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const { data, error } = await getHomeTrainingStats(30);
      if (!error && data) {
        setStats(data);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-4">กำลังโหลด...</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">จำนวนครั้งทั้งหมด</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_sessions || 0}</div>
          <p className="text-xs text-muted-foreground">ใน 30 วันที่ผ่านมา</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">เวลารวม</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_duration_minutes || 0}</div>
          <p className="text-xs text-muted-foreground">นาที</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ได้รับการอนุมัติ</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approved_sessions || 0}</div>
          <p className="text-xs text-muted-foreground">ครั้ง</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">รอตรวจสอบ</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending_reviews || 0}</div>
          <p className="text-xs text-muted-foreground">ครั้ง</p>
        </CardContent>
      </Card>
    </div>
  );
}
