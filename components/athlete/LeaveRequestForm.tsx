'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { requestLeave } from '@/lib/athlete/attendance-actions';
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface LeaveRequestFormProps {
  sessionId: string;
  sessionTitle?: string;
  sessionDate: string;
  startTime: string;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * LeaveRequestForm Component
 * 
 * Reason textarea (min 10 characters)
 * Validate timing (at least 2 hours before session)
 * Call requestLeave action
 * Show submission status
 * 
 * Requirements: BR2
 */
export function LeaveRequestForm({
  sessionId,
  sessionTitle,
  sessionDate,
  startTime,
  disabled = false,
  className = '',
  onSuccess,
  onError,
}: LeaveRequestFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Validate timing - must be at least 2 hours before session
   * BR2: Must request leave at least 2 hours before session start
   */
  const validateTiming = (): { valid: boolean; message?: string } => {
    const sessionDateTime = new Date(`${sessionDate}T${startTime}`);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (sessionDateTime < twoHoursFromNow) {
      const hoursUntil = Math.ceil((sessionDateTime.getTime() - now.getTime()) / (60 * 60 * 1000));
      return {
        valid: false,
        message: `ต้องแจ้งลาล่วงหน้าอย่างน้อย 2 ชั่วโมงก่อนเวลาเริ่ม (เหลือเวลาอีก ${hoursUntil} ชั่วโมง)`,
      };
    }

    return { valid: true };
  };

  /**
   * Validate reason - must be at least 10 characters
   * BR2: Reason must not be empty (at least 10 characters)
   */
  const validateReason = (value: string): { valid: boolean; message?: string } => {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return {
        valid: false,
        message: 'กรุณาระบุเหตุผล',
      };
    }

    if (trimmedValue.length < 10) {
      return {
        valid: false,
        message: `กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร (ปัจจุบัน: ${trimmedValue.length} ตัวอักษร)`,
      };
    }

    return { valid: true };
  };

  /**
   * Handle reason input change with validation
   */
  const handleReasonChange = (value: string) => {
    setReason(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }

    // Show character count hint when approaching minimum
    const trimmedLength = value.trim().length;
    if (trimmedLength > 0 && trimmedLength < 10) {
      setValidationError(`ต้องการอีก ${10 - trimmedLength} ตัวอักษร`);
    }
  };

  /**
   * Handle form submission
   * Validates reason and timing before showing confirmation dialog
   */
  const handleSubmit = () => {
    setError(null);
    setValidationError(null);

    // Validate reason
    const reasonValidation = validateReason(reason);
    if (!reasonValidation.valid) {
      setValidationError(reasonValidation.message || 'เหตุผลไม่ถูกต้อง');
      if (onError) {
        onError(reasonValidation.message || 'เหตุผลไม่ถูกต้อง');
      }
      return;
    }

    // Validate timing
    const timingValidation = validateTiming();
    if (!timingValidation.valid) {
      setError(timingValidation.message || 'ไม่สามารถแจ้งลาได้ในขณะนี้');
      if (onError) {
        onError(timingValidation.message || 'ไม่สามารถแจ้งลาได้ในขณะนี้');
      }
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  /**
   * Handle leave request confirmation
   * Calls requestLeave action and handles response
   */
  const handleConfirmLeaveRequest = async () => {
    setIsSubmitting(true);
    setError(null);
    setShowConfirmDialog(false);

    try {
      const result = await requestLeave({
        sessionId,
        reason: reason.trim(),
      });

      if (result.error) {
        setError(result.error);
        if (onError) {
          onError(result.error);
        }
      } else {
        // Success
        setShowSuccessDialog(true);
        setReason(''); // Clear form
        if (onSuccess) {
          onSuccess();
        }
        // Refresh the page to show updated status
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      const errorMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get timing status for display
   */
  const getTimingStatus = (): {
    canRequest: boolean;
    message: string;
    color: string;
  } => {
    const validation = validateTiming();
    
    if (!validation.valid) {
      return {
        canRequest: false,
        message: validation.message || 'ไม่สามารถแจ้งลาได้',
        color: 'text-red-600',
      };
    }

    const sessionDateTime = new Date(`${sessionDate}T${startTime}`);
    const now = new Date();
    const hoursUntil = Math.floor((sessionDateTime.getTime() - now.getTime()) / (60 * 60 * 1000));

    return {
      canRequest: true,
      message: `สามารถแจ้งลาได้ (เหลือเวลาอีก ${hoursUntil} ชั่วโมง)`,
      color: 'text-green-600',
    };
  };

  const timingStatus = getTimingStatus();
  const isDisabled = disabled || isSubmitting || !timingStatus.canRequest;
  const characterCount = reason.trim().length;

  return (
    <>
      {/* Leave Request Form */}
      <div className={`space-y-4 ${className}`}>
        {/* Timing Status */}
        <div className={`flex items-center gap-2 text-sm ${timingStatus.color}`}>
          <Clock className="h-4 w-4" />
          <span>{timingStatus.message}</span>
        </div>

        {/* Reason Textarea */}
        <div className="space-y-2">
          <Label htmlFor="leave-reason">
            เหตุผลในการลา <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="leave-reason"
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            placeholder="กรุณาระบุเหตุผลในการลา (อย่างน้อย 10 ตัวอักษร)"
            rows={4}
            disabled={isDisabled}
            className={validationError ? 'border-red-300 focus:border-red-500' : ''}
          />
          
          {/* Character Count */}
          <div className="flex justify-between items-center text-xs">
            <span className={characterCount < 10 ? 'text-gray-500' : 'text-green-600'}>
              {characterCount} / 10 ตัวอักษรขั้นต่ำ
            </span>
            {validationError && (
              <span className="text-red-600">{validationError}</span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isDisabled || characterCount < 10}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              กำลังส่งคำขอ...
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-5 w-5" />
              ส่งคำขอลา
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการแจ้งลา</DialogTitle>
            <DialogDescription asChild>
              <div>
                {sessionTitle && (
                  <div className="mt-2 mb-4">
                    <div className="font-medium text-gray-900">{sessionTitle}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(`${sessionDate}T${startTime}`).toLocaleString('th-TH', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}
                <div className="text-gray-700 mb-3">
                  คุณต้องการแจ้งลาการฝึกซ้อมนี้ใช่หรือไม่?
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">เหตุผล:</div>
                  <div className="text-sm text-gray-600">{reason.trim()}</div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      คำขอลาจะถูกส่งไปยังโค้ชเพื่อพิจารณาอนุมัติ
                    </div>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmLeaveRequest} disabled={isSubmitting}>
              {isSubmitting ? 'กำลังส่ง...' : 'ยืนยันการแจ้งลา'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              ส่งคำขอลาสำเร็จ
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <div className="text-gray-700 mt-2">
                  คำขอลาของคุณได้ถูกส่งไปยังโค้ชเรียบร้อยแล้ว
                </div>
                {sessionTitle && (
                  <div className="text-sm text-gray-600 mt-2">
                    {sessionTitle}
                  </div>
                )}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700">
                    โค้ชจะพิจารณาคำขอของคุณและแจ้งผลกลับโดยเร็ว
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
