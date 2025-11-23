'use client';

import { MembershipApplication, ApplicationStatus } from '@/types/database.types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface ApplicationWithClub extends MembershipApplication {
  clubs?: {
    id: string;
    name: string;
    sport_type: string;
    description?: string;
  };
}

interface ApplicationStatusCardProps {
  application: ApplicationWithClub;
  onViewDetails: (application: ApplicationWithClub) => void;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: 'รอพิจารณา',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Clock,
  },
  approved: {
    label: 'อนุมัติแล้ว',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'ไม่อนุมัติ',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  info_requested: {
    label: 'ขอข้อมูลเพิ่มเติม',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: AlertCircle,
  },
};

export function ApplicationStatusCard({
  application,
  onViewDetails,
}: ApplicationStatusCardProps) {
  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Get club name and sport type
  const clubName = application.clubs?.name || 'ไม่ระบุกีฬา';
  const sportType = application.clubs?.sport_type || '';

  // Get review info if available
  const reviewInfo =
    typeof application.review_info === 'object' && application.review_info !== null
      ? (application.review_info as any)
      : null;

  const rejectionReason = reviewInfo?.notes;
  const approvalDate = reviewInfo?.reviewed_at;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-gray-300 active:scale-[0.99]"
      onClick={() => onViewDetails(application)}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header: Club Name and Status Badge */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {clubName}
              </h3>
              {sportType && (
                <p className="text-sm text-gray-600 mt-1">{sportType}</p>
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color} text-sm font-medium whitespace-nowrap`}
            >
              <StatusIcon className="h-4 w-4" />
              <span>{statusConfig.label}</span>
            </div>
          </div>

          {/* Submitted Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>วันที่สมัคร: {formatDate(application.created_at)}</span>
          </div>

          {/* Conditional Information Based on Status */}
          {application.status === 'rejected' && rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900 mb-1">
                เหตุผลที่ไม่อนุมัติ:
              </p>
              <p className="text-sm text-red-700">{rejectionReason}</p>
            </div>
          )}

          {application.status === 'approved' && approvalDate && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <span className="font-medium">อนุมัติเมื่อ:</span>{' '}
                {formatDate(approvalDate)}
              </p>
            </div>
          )}

          {application.status === 'info_requested' && rejectionReason && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">
                ข้อมูลที่ต้องการเพิ่มเติม:
              </p>
              <p className="text-sm text-blue-700">{rejectionReason}</p>
            </div>
          )}

          {/* View Details Hint */}
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              คลิกเพื่อดูรายละเอียดเพิ่มเติม
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
