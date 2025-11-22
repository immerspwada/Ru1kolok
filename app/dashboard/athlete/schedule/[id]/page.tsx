import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionDetails } from '@/lib/athlete/attendance-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckInButton } from '@/components/athlete/CheckInButton';
import { LeaveRequestForm } from '@/components/athlete/LeaveRequestForm';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function SessionDetailPage({ params }: PageProps) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get session details
  const { data: session, error } = await getSessionDetails(params.id);

  if (error || !session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error || 'ไม่พบตารางฝึกซ้อม'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get coach name
  let coachName = 'ไม่ระบุ';
  if (session.coach_id) {
    const { data: coach } = await supabase
      .from('coaches')
      .select('first_name, last_name')
      .eq('id', session.coach_id)
      .maybeSingle();
    
    if (coach) {
      // @ts-ignore - Supabase type inference issue with select
      coachName = `${coach.first_name} ${coach.last_name}`;
    }
  }

  // Format date and time
  const sessionDate = new Date(session.session_date);
  const formattedDate = sessionDate.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Determine check-in eligibility
  const hasCheckedIn = !!session.attendance;
  const hasLeaveRequest = !!session.leave_request;
  const isCancelled = session.status === 'cancelled';

  // Get status display
  const getStatusDisplay = () => {
    if (isCancelled) {
      return {
        icon: XCircle,
        text: 'ยกเลิกแล้ว',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      };
    }

    if (hasCheckedIn) {
      const status = session.attendance?.status;
      if (status === 'present') {
        return {
          icon: CheckCircle,
          text: 'เข้าร่วมแล้ว',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      } else if (status === 'late') {
        return {
          icon: AlertCircle,
          text: 'เข้าร่วมแล้ว (สาย)',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      }
    }

    if (hasLeaveRequest) {
      const status = session.leave_request?.status;
      if (status === 'pending') {
        return {
          icon: Clock,
          text: 'รอการอนุมัติการลา',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      } else if (status === 'approved') {
        return {
          icon: CheckCircle,
          text: 'ลาได้รับอนุมัติ',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      } else if (status === 'rejected') {
        return {
          icon: XCircle,
          text: 'การลาถูกปฏิเสธ',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      }
    }

    return {
      icon: Clock,
      text: 'ยังไม่ได้เช็คอิน',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    };
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // Determine if check-in button should be shown
  const canCheckIn = !hasCheckedIn && !hasLeaveRequest && !isCancelled;

  // Determine if leave request form should be shown
  const canRequestLeave = !hasCheckedIn && !hasLeaveRequest && !isCancelled;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {session.title || 'ตารางฝึกซ้อม'}
        </h1>
        <p className="text-gray-600">รายละเอียดการฝึกซ้อม</p>
      </div>

      {/* Status Card */}
      <Card className={`mb-6 ${statusDisplay.borderColor} border-2`}>
        <CardContent className={`pt-6 ${statusDisplay.bgColor}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${statusDisplay.color}`} />
            <div>
              <div className={`font-semibold ${statusDisplay.color}`}>
                {statusDisplay.text}
              </div>
              {hasCheckedIn && session.attendance?.check_in_time && (
                <div className="text-sm text-gray-600 mt-1">
                  เช็คอินเมื่อ:{' '}
                  {new Date(session.attendance.check_in_time).toLocaleString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {hasLeaveRequest && session.leave_request?.reason && (
                <div className="text-sm text-gray-600 mt-1">
                  เหตุผล: {session.leave_request.reason}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>รายละเอียดการฝึกซ้อม</CardTitle>
          <CardDescription>ข้อมูลเกี่ยวกับการฝึกซ้อมครั้งนี้</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">วันที่</div>
              <div className="text-gray-600">{formattedDate}</div>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">เวลา</div>
              <div className="text-gray-600">
                {session.start_time} - {session.end_time}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">สถานที่</div>
              <div className="text-gray-600">{session.location || 'ไม่ระบุ'}</div>
            </div>
          </div>

          {/* Coach */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">โค้ช</div>
              <div className="text-gray-600">{coachName}</div>
            </div>
          </div>



          {/* Description */}
          {session.description && (
            <div className="pt-4 border-t">
              <div className="font-medium text-gray-900 mb-2">รายละเอียดเพิ่มเติม</div>
              <div className="text-gray-600 whitespace-pre-wrap">{session.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Section */}
      {canCheckIn && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>เช็คอินเข้าร่วม</CardTitle>
            <CardDescription>
              คุณสามารถเช็คอินได้ 30 นาทีก่อนเวลาเริ่ม จนถึง 15 นาทีหลังเวลาเริ่ม
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckInButton
              sessionId={session.id}
              sessionDate={session.session_date}
              startTime={session.start_time}
              sessionTitle={session.title || undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Leave Request Section */}
      {canRequestLeave && (
        <Card>
          <CardHeader>
            <CardTitle>แจ้งลา</CardTitle>
            <CardDescription>
              หากคุณไม่สามารถเข้าร่วมได้ กรุณาแจ้งลาล่วงหน้าอย่างน้อย 2 ชั่วโมง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveRequestForm
              sessionId={session.id}
              sessionTitle={session.title || undefined}
              sessionDate={session.session_date}
              startTime={session.start_time}
            />
          </CardContent>
        </Card>
      )}

      {/* Cancelled Notice */}
      {isCancelled && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900 mb-1">
                  ตารางฝึกซ้อมนี้ถูกยกเลิกแล้ว
                </div>
                <div className="text-sm text-red-700">
                  โค้ชได้ยกเลิกตารางฝึกซ้อมนี้ กรุณาติดต่อโค้ชเพื่อสอบถามข้อมูลเพิ่มเติม
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
