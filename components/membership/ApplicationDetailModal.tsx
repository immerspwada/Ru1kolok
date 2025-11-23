'use client';

/**
 * Application Detail Modal Component
 * 
 * Displays full details of a membership application in a modal dialog.
 * Allows coaches/admins to review and approve/reject applications.
 * 
 * Features:
 * - Display personal info from JSONB
 * - Display all 3 document types with thumbnails
 * - Clickable documents to view full size
 * - Activity timeline from activity_log JSONB
 * - Approve button (with confirmation) - coaches/admins only
 * - Reject button with reason textarea - coaches/admins only
 * - Calls reviewApplication() action
 * 
 * Validates: Requirements US-3.2, US-3.3, US-3.4, US-3.5, US-8
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, FileText, Phone, MapPin, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS } from '@/lib/membership/validation';

interface Application {
  id: string;
  user_id: string;
  club_id: string;
  personal_info: {
    full_name: string;
    phone_number: string;
    address: string;
    emergency_contact: string;
    date_of_birth?: string;
    blood_type?: string;
    medical_conditions?: string;
  };
  documents: Array<{
    type: 'id_card' | 'house_registration' | 'birth_certificate';
    url: string;
    file_name: string;
    file_size: number;
    uploaded_at: string;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  review_info?: {
    reviewed_by: string;
    reviewed_at: string;
    reviewer_role: string;
    notes?: string;
  };
  activity_log: Array<{
    timestamp: string;
    action: string;
    by_user: string;
    by_role: string;
    details?: any;
  }>;
  created_at: string;
  clubs?: {
    name: string;
    sport_type: string | null;
  };
}

interface ApplicationDetailModalProps {
  application: Application | null;
  onApprove: (applicationId: string) => Promise<void>;
  onReject: (applicationId: string, reason: string) => Promise<void>;
  onClose: () => void;
  isCoach: boolean;
}

export function ApplicationDetailModal({
  application,
  onApprove,
  onReject,
  onClose,
  isCoach,
}: ApplicationDetailModalProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!application) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(application.id);
      setShowApproveDialog(false);
      onClose();
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(application.id, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
      onClose();
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const canTakeAction = isCoach && application.status === 'pending';

  return (
    <>
      <Dialog open={!!application} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">รายละเอียดใบสมัคร</DialogTitle>
            <DialogDescription>
              ใบสมัครเข้าร่วม {application.clubs?.name || 'N/A'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ข้อมูลส่วนตัว
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <Label className="text-gray-600">ชื่อ-นามสกุล</Label>
                  <p className="font-medium">{application.personal_info.full_name}</p>
                </div>
                <div>
                  <Label className="text-gray-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    เบอร์โทรศัพท์
                  </Label>
                  <p className="font-medium">{application.personal_info.phone_number}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    ที่อยู่
                  </Label>
                  <p className="font-medium">{application.personal_info.address}</p>
                </div>
                <div>
                  <Label className="text-gray-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    เบอร์ฉุกเฉิน
                  </Label>
                  <p className="font-medium">{application.personal_info.emergency_contact}</p>
                </div>
                {application.personal_info.date_of_birth && (
                  <div>
                    <Label className="text-gray-600">วันเกิด</Label>
                    <p className="font-medium">
                      {new Date(application.personal_info.date_of_birth).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}
                {application.personal_info.blood_type && (
                  <div>
                    <Label className="text-gray-600">กรุ๊ปเลือด</Label>
                    <p className="font-medium">{application.personal_info.blood_type}</p>
                  </div>
                )}
                {application.personal_info.medical_conditions && (
                  <div className="md:col-span-2">
                    <Label className="text-gray-600">โรคประจำตัว / ข้อมูลสุขภาพ</Label>
                    <p className="font-medium">{application.personal_info.medical_conditions}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-3">เอกสารประกอบ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {application.documents.map((doc) => (
                  <div key={doc.type} className="border rounded-lg p-3 space-y-2">
                    <Label className="text-sm font-medium">
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                    </Label>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {doc.url.toLowerCase().endsWith('.pdf') ? (
                        <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center justify-center h-32">
                          <FileText className="w-12 h-12 text-red-500" />
                        </div>
                      ) : (
                        <img
                          src={doc.url}
                          alt={DOCUMENT_TYPE_LABELS[doc.type]}
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                    </a>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="truncate">{doc.file_name}</p>
                      <p>{formatFileSize(doc.file_size)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        ดูเอกสาร
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Activity Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3">ประวัติการดำเนินการ</h3>
              <div className="space-y-3">
                {application.activity_log.map((log, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div className="flex-1 pb-3 border-b last:border-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {log.action === 'submitted' && '📝 ส่งใบสมัคร'}
                            {log.action === 'status_changed' && '🔄 เปลี่ยนสถานะ'}
                            {log.action === 'document_updated' && '📎 อัปเดตเอกสาร'}
                            {log.action === 'profile_created' && '✅ สร้างโปรไฟล์'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            โดย: {log.by_role} • {formatDate(log.timestamp)}
                          </p>
                          {log.details && (
                            <div className="mt-2 text-sm text-gray-700">
                              {log.details.notes && <p>หมายเหตุ: {log.details.notes}</p>}
                              {log.details.from && log.details.to && (
                                <p>
                                  {log.details.from} → {log.details.to}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Info (if rejected) */}
            {application.status === 'rejected' && application.review_info?.notes && (
              <>
                <Separator />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">เหตุผลที่ไม่อนุมัติ</h3>
                  <p className="text-red-800">{application.review_info.notes}</p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            {canTakeAction && (
              <>
                <Separator />
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    ไม่อนุมัติ
                  </Button>
                  <Button
                    onClick={() => setShowApproveDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    อนุมัติ
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการอนุมัติ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการอนุมัติใบสมัครของ <strong>{application.personal_info.full_name}</strong> ใช่หรือไม่?
              <br />
              <br />
              เมื่ออนุมัติแล้ว ระบบจะสร้างโปรไฟล์นักกีฬาให้อัตโนมัติ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                'ยืนยันอนุมัติ'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ไม่อนุมัติใบสมัคร</AlertDialogTitle>
            <AlertDialogDescription>
              กรุณาระบุเหตุผลที่ไม่อนุมัติใบสมัครของ <strong>{application.personal_info.full_name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="ระบุเหตุผล..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                'ยืนยันไม่อนุมัติ'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ApplicationDetailModal;
