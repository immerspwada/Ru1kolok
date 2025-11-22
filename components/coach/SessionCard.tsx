'use client';

import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Database } from '@/types/database.types';
import Link from 'next/link';

type TrainingSession = Database['public']['Tables']['training_sessions']['Row'];

interface SessionCardProps {
  session: TrainingSession & { attendance_count?: number };
  onViewDetails?: (sessionId: string) => void;
  onEdit?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
}

export function SessionCard({
  session,
  onViewDetails,
  onEdit,
  onCancel,
}: SessionCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:MM
  };

  // Determine status
  const getStatus = () => {
    const sessionDate = new Date(session.session_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate < today) {
      return 'completed';
    } else if (sessionDate.getTime() === today.getTime()) {
      return 'ongoing';
    } else {
      return 'scheduled';
    }
  };

  const status = getStatus();

  // Status badge styling
  const statusConfig = {
    scheduled: {
      label: 'กำหนดการ',
      className: 'bg-blue-100 text-blue-700',
    },
    ongoing: {
      label: 'วันนี้',
      className: 'bg-green-100 text-green-700',
    },
    completed: {
      label: 'เสร็จสิ้น',
      className: 'bg-gray-100 text-gray-700',
    },
    cancelled: {
      label: 'ยกเลิก',
      className: 'bg-red-100 text-red-700',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {/* Status Badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${currentStatus.className}`}
          >
            {currentStatus.label}
          </span>
        </div>

        {/* Session Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {session.title}
        </h3>

        {/* Session Info */}
        <div className="space-y-2">
          {/* Date */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{formatDate(session.session_date)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{session.location}</span>
          </div>

          {/* Attendance Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{session.attendance_count || 0} คน</span>
          </div>
        </div>

        {/* Description (if exists) */}
        {session.description && (
          <p className="mt-3 text-sm text-gray-500 line-clamp-2">
            {session.description}
          </p>
        )}
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="flex gap-2 border-t pt-4">
        <Link href={`/dashboard/coach/sessions/${session.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
          >
            ดูรายละเอียด
          </Button>
        </Link>
        {status === 'scheduled' && (
          <>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(session.id)}
              >
                แก้ไข
              </Button>
            )}
            {onCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(session.id)}
              >
                ยกเลิก
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
