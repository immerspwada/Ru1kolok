'use client';

/**
 * Coach Applications Page
 * 
 * This page allows coaches to view and manage membership applications
 * for their sport/club. Coaches can approve or reject applications.
 * 
 * Features:
 * - Fetch applications using getClubApplications(clubId)
 * - Display stats cards: pending, approved, rejected counts
 * - Render ApplicationList component
 * - Handle view details (ApplicationDetailModal)
 * - Handle approve/reject actions
 * - Toast notifications for success/error
 * - Auto-refresh after actions
 * 
 * Validates: Requirements US-3, US-7
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getClubApplications } from '@/lib/membership/queries';
import { reviewApplication } from '@/lib/membership/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ApplicationList from '@/components/membership/ApplicationList';
import ApplicationDetailModal from '@/components/membership/ApplicationDetailModal';
import { Loader2, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Application {
  id: string;
  user_id: string;
  club_id: string;
  personal_info: any;
  documents: any[];
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  review_info?: any;
  activity_log: any[];
  profile_id: string | null;
  created_at: string;
  updated_at: string;
  clubs?: {
    id: string;
    name: string;
    sport_type: string | null;
  };
}

export default function CoachApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachClubId, setCoachClubId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);

    try {
      // Get current user and their coach profile
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast({
          title: 'กรุณาเข้าสู่ระบบ',
          description: 'คุณต้องเข้าสู่ระบบเพื่อดูใบสมัคร',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      // Get coach's club_id
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('club_id')
        .eq('user_id', user.id)
        .single();

      if (coachError || !coachData) {
        toast({
          title: 'ไม่พบข้อมูลโค้ช',
          description: 'ไม่พบข้อมูลโค้ชในระบบ',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const clubId = (coachData as any).club_id;
      setCoachClubId(clubId);

      // Fetch applications for this club
      const result = await getClubApplications(clubId);

      if (result.error) {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        setApplications((result.data || []) as Application[]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดใบสมัครได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(applicationId: string) {
    const result = await reviewApplication(applicationId, 'approve');

    if (result.success) {
      toast({
        title: 'อนุมัติสำเร็จ! 🎉',
        description: 'ใบสมัครได้รับการอนุมัติแล้ว และสร้างโปรไฟล์นักกีฬาเรียบร้อย',
        variant: 'default',
      });
      // Refresh list
      await loadApplications();
    } else {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: result.error || 'ไม่สามารถอนุมัติใบสมัครได้',
        variant: 'destructive',
      });
    }
  }

  async function handleReject(applicationId: string, reason: string) {
    const result = await reviewApplication(applicationId, 'reject', reason);

    if (result.success) {
      toast({
        title: 'ปฏิเสธใบสมัครแล้ว',
        description: 'ใบสมัครถูกปฏิเสธเรียบร้อย',
        variant: 'default',
      });
      // Refresh list
      await loadApplications();
    } else {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: result.error || 'ไม่สามารถปฏิเสธใบสมัครได้',
        variant: 'destructive',
      });
    }
  }

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดใบสมัคร...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ใบสมัครสมาชิก</h1>
        <p className="text-gray-600 mt-1">จัดการใบสมัครเข้าร่วมกีฬาของคุณ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>ทั้งหมด</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-600">
              <FileText className="w-4 h-4 mr-1" />
              ใบสมัครทั้งหมด
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>รอพิจารณา</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              ต้องดำเนินการ
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>อนุมัติแล้ว</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              เข้าร่วมแล้ว
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>ไม่อนุมัติ</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-600">
              <XCircle className="w-4 h-4 mr-1" />
              ถูกปฏิเสธ
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการใบสมัคร</CardTitle>
          <CardDescription>
            คลิกที่แถวเพื่อดูรายละเอียดและดำเนินการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationList
            applications={applications}
            onViewDetails={(app) => setSelectedApplication(app as any)}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        application={selectedApplication}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => setSelectedApplication(null)}
        isCoach={true}
      />
    </div>
  );
}
