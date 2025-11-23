'use client';

/**
 * Admin Applications Dashboard Component
 * 
 * Displays all membership applications across all sports with:
 * - Stats overview cards (total, pending, approved, rejected)
 * - Stats breakdown by club (table)
 * - Filter controls (club dropdown, status dropdown, date range picker)
 * - Application list with view/review capabilities
 * - Admin override capability for approve/reject
 * 
 * Validates: Requirements US-7
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MembershipApplication, ApplicationStatus } from '@/types/database.types';
import { ApplicationList } from '@/components/membership/ApplicationList';
import { ApplicationDetailModal } from '@/components/membership/ApplicationDetailModal';
import { StatCard } from '@/components/admin/StatCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  Filter,
  RotateCcw,
} from 'lucide-react';

interface ApplicationWithClub extends MembershipApplication {
  clubs?: {
    name: string;
    sport_type: string;
  };
}

interface Club {
  id: string;
  name: string;
  sport_type: string;
  description?: string;
}

interface AdminApplicationsDashboardProps {
  applications: ApplicationWithClub[];
  clubs: Club[];
  initialFilters: {
    clubId?: string;
    status?: ApplicationStatus;
    startDate?: string;
    endDate?: string;
  };
}

export default function AdminApplicationsDashboard({
  applications,
  clubs,
  initialFilters,
}: AdminApplicationsDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Filter state
  const [clubFilter, setClubFilter] = useState<string>(initialFilters.clubId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || 'all');
  const [startDate, setStartDate] = useState<string>(initialFilters.startDate || '');
  const [endDate, setEndDate] = useState<string>(initialFilters.endDate || '');

  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithClub | null>(null);

  // Handler functions
  const handleViewDetails = (application: ApplicationWithClub) => {
    setSelectedApplication(application);
  };

  const handleApprove = async (applicationId: string) => {
    // This will be handled by the modal's reviewApplication action
    toast({
      title: 'กำลังดำเนินการ',
      description: 'กำลังอนุมัติใบสมัคร...',
    });
    router.refresh();
  };

  const handleReject = async (applicationId: string, reason: string) => {
    // This will be handled by the modal's reviewApplication action
    toast({
      title: 'กำลังดำเนินการ',
      description: 'กำลังปฏิเสธใบสมัคร...',
    });
    router.refresh();
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((app) => app.status === 'pending').length;
    const approved = applications.filter((app) => app.status === 'approved').length;
    const rejected = applications.filter((app) => app.status === 'rejected').length;

    return { total, pending, approved, rejected };
  }, [applications]);

  // Calculate club breakdown
  const clubBreakdown = useMemo(() => {
    const breakdown = new Map<string, {
      clubName: string;
      sportType: string;
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    }>();

    applications.forEach((app) => {
      if (!app.clubs) return;

      const clubId = app.club_id;
      const existing = breakdown.get(clubId) || {
        clubName: app.clubs.name,
        sportType: app.clubs.sport_type,
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      existing.total++;
      if (app.status === 'pending') existing.pending++;
      if (app.status === 'approved') existing.approved++;
      if (app.status === 'rejected') existing.rejected++;

      breakdown.set(clubId, existing);
    });

    return Array.from(breakdown.values());
  }, [applications]);

  // Apply filters
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Club filter
      if (clubFilter !== 'all' && app.club_id !== clubFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const appDate = new Date(app.created_at);
        const filterDate = new Date(startDate);
        if (appDate < filterDate) return false;
      }

      if (endDate) {
        const appDate = new Date(app.created_at);
        const filterDate = new Date(endDate);
        filterDate.setHours(23, 59, 59, 999); // End of day
        if (appDate > filterDate) return false;
      }

      return true;
    });
  }, [applications, clubFilter, statusFilter, startDate, endDate]);

  // Handle filter application
  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    if (clubFilter !== 'all') params.set('clubId', clubFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const queryString = params.toString();
    router.push(`/dashboard/admin/applications${queryString ? `?${queryString}` : ''}`);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setClubFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    router.push('/dashboard/admin/applications');
  };

  // Handle approve/reject success (duplicate removed - already defined above)
  const handleReviewSuccess = () => {
    toast({
      title: 'สำเร็จ',
      description: 'ดำเนินการเรียบร้อยแล้ว',
    });
    setSelectedApplication(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ใบสมัครทั้งหมด"
          value={stats.total}
          icon={FileText}
          description="จำนวนใบสมัครทั้งหมดในระบบ"
        />
        <StatCard
          title="รอพิจารณา"
          value={stats.pending}
          icon={Clock}
          description="ใบสมัครที่รอการอนุมัติ"
        />
        <StatCard
          title="อนุมัติแล้ว"
          value={stats.approved}
          icon={CheckCircle}
          description="ใบสมัครที่อนุมัติแล้ว"
        />
        <StatCard
          title="ไม่อนุมัติ"
          value={stats.rejected}
          icon={XCircle}
          description="ใบสมัครที่ปฏิเสธ"
        />
      </div>

      {/* Club Breakdown Table */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              สถิติแยกตามกีฬา
            </h2>
          </div>
        </div>
        <div className="p-6">
          {clubBreakdown.length === 0 ? (
            <p className="text-center text-gray-500 py-8">ยังไม่มีข้อมูล</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>กีฬา</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">ทั้งหมด</TableHead>
                  <TableHead className="text-right">รอพิจารณา</TableHead>
                  <TableHead className="text-right">อนุมัติ</TableHead>
                  <TableHead className="text-right">ปฏิเสธ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubBreakdown.map((club, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{club.clubName}</TableCell>
                    <TableCell className="text-gray-600">{club.sportType}</TableCell>
                    <TableCell className="text-right">{club.total}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        {club.pending}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {club.approved}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        {club.rejected}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              กรองข้อมูล
            </h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Club Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                กีฬา
              </label>
              <Select value={clubFilter} onValueChange={setClubFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกกีฬา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                สถานะ
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอพิจารณา</SelectItem>
                  <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                  <SelectItem value="info_requested">ขอข้อมูลเพิ่มเติม</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                วันที่เริ่มต้น
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                วันที่สิ้นสุด
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              ใช้ตัวกรอง
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              <RotateCcw className="h-4 w-4 mr-2" />
              รีเซ็ต
            </Button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            รายการใบสมัคร ({filteredApplications.length})
          </h2>
        </div>
        <div className="p-6">
          <ApplicationList
            applications={filteredApplications as any}
            onViewDetails={(app) => handleViewDetails(app as any)}
            loading={false}
          />
        </div>
      </div>

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        application={selectedApplication as any}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => setSelectedApplication(null)}
        isCoach={true} // Admin has coach-like permissions (can approve/reject)
      />
    </div>
  );
}
