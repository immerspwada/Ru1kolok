'use client';

import { ActivityLogEntry } from '@/types/database.types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  UserCheck,
  AlertCircle,
  Send
} from 'lucide-react';

interface ActivityTimelineProps {
  activityLog: ActivityLogEntry[];
}

// Helper function to format timestamp in Thai locale with relative time
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Relative time in Thai
  if (diffInSeconds < 60) {
    return 'เมื่อสักครู่';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} นาทีที่แล้ว`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ชั่วโมงที่แล้ว`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} วันที่แล้ว`;
  }

  // Absolute time in Thai format
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to get icon and color based on action type
function getActionIcon(action: string, entry: ActivityLogEntry) {
  switch (action) {
    case 'submitted':
      return { icon: Send, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    case 'status_changed':
      if (entry.to === 'approved') {
        return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-50' };
      } else if (entry.to === 'rejected') {
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50' };
      } else if (entry.to === 'info_requested') {
        return { icon: AlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
      }
      return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50' };
    case 'document_uploaded':
      return { icon: FileText, color: 'text-purple-500', bgColor: 'bg-purple-50' };
    case 'profile_created':
      return { icon: UserCheck, color: 'text-green-500', bgColor: 'bg-green-50' };
    default:
      return { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

// Helper function to get action description in Thai
function getActionDescription(entry: ActivityLogEntry): string {
  const { action, by_role, from, to, notes, details } = entry;

  const roleLabel = {
    admin: 'ผู้ดูแลระบบ',
    coach: 'โค้ช',
    athlete: 'นักกีฬา',
  }[by_role] || by_role;

  switch (action) {
    case 'submitted':
      return 'ส่งใบสมัครเข้าร่วมกีฬา';
    case 'status_changed':
      const statusLabels: Record<string, string> = {
        pending: 'รอพิจารณา',
        approved: 'อนุมัติ',
        rejected: 'ไม่อนุมัติ',
        info_requested: 'ขอข้อมูลเพิ่มเติม',
      };
      const fromLabel = from ? statusLabels[from] || from : '';
      const toLabel = to ? statusLabels[to] || to : '';
      return `${roleLabel}เปลี่ยนสถานะจาก "${fromLabel}" เป็น "${toLabel}"`;
    case 'document_uploaded':
      const docType = details?.document_type || 'เอกสาร';
      const docLabels: Record<string, string> = {
        id_card: 'บัตรประชาชน',
        house_registration: 'ทะเบียนบ้าน',
        birth_certificate: 'สูติบัตร',
      };
      return `อัปโหลด${docLabels[docType] || docType}`;
    case 'profile_created':
      return `${roleLabel}สร้างโปรไฟล์นักกีฬา`;
    default:
      return details?.message || action;
  }
}

export default function ActivityTimeline({ activityLog }: ActivityTimelineProps) {
  // Sort by timestamp descending (newest first)
  const sortedLog = [...activityLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedLog.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>ยังไม่มีประวัติการดำเนินการ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedLog.map((entry, index) => {
        const { icon: Icon, color, bgColor } = getActionIcon(entry.action, entry);
        const description = getActionDescription(entry);
        const timestamp = formatTimestamp(entry.timestamp);
        const isLast = index === sortedLog.length - 1;

        return (
          <div key={index} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center z-10`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900">{description}</p>
                
                {entry.notes && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                    <span className="font-medium">หมายเหตุ:</span> {entry.notes}
                  </p>
                )}

                {entry.details && Object.keys(entry.details).length > 0 && entry.action !== 'document_uploaded' && (
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(entry.details).map(([key, value]) => {
                      if (key === 'message' || key === 'document_type') return null;
                      return (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">{timestamp}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
