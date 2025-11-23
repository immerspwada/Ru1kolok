'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createSession } from '@/lib/coach/session-actions';
import { Loader2, AlertCircle } from 'lucide-react';

interface SessionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SessionForm({ onSuccess, onCancel }: SessionFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  // Client-side validation with field-specific errors
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Check required fields
    if (!formData.title.trim()) {
      errors.title = 'กรุณากรอกชื่อตารางฝึกซ้อม';
    }

    if (!formData.session_date) {
      errors.session_date = 'กรุณาเลือกวันที่';
    }

    if (!formData.start_time) {
      errors.start_time = 'กรุณาเลือกเวลาเริ่ม';
    }

    if (!formData.end_time) {
      errors.end_time = 'กรุณาเลือกเวลาสิ้นสุด';
    }

    if (!formData.location.trim()) {
      errors.location = 'กรุณากรอกสถานที่';
    }

    // Validate date is not in the past
    if (formData.session_date) {
      const sessionDate = new Date(formData.session_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (sessionDate < today) {
        errors.session_date = 'ไม่สามารถสร้างตารางในอดีตได้';
      }
    }

    // Validate start_time < end_time
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errors.end_time = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Client-side validation
    if (!validateForm()) {
      setLoading(false);
      addToast({
        title: 'ข้อมูลไม่ถูกต้อง',
        description: 'กรุณาตรวจสอบข้อมูลที่กรอกและลองอีกครั้ง',
        variant: 'error',
      });
      return;
    }

    // Call server action
    const result = await createSession({
      title: formData.title,
      description: formData.description || undefined,
      session_date: formData.session_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
    });

    if (result.success) {
      addToast({
        title: 'สำเร็จ!',
        description: 'สร้างตารางฝึกซ้อมเรียบร้อยแล้ว',
        variant: 'success',
      });
      
      setFormData({
        title: '',
        description: '',
        session_date: '',
        start_time: '',
        end_time: '',
        location: '',
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Refresh the page to show new session
        router.refresh();
      }
    } else {
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: result.error || 'ไม่สามารถสร้างตารางฝึกซ้อมได้',
        variant: 'error',
      });
    }

    setLoading(false);
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          ชื่อตารางฝึกซ้อม <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value });
            clearFieldError('title');
          }}
          placeholder="เช่น ฝึกซ้อมประจำวัน, ฝึกซ้อมพิเศษ"
          required
          disabled={loading}
          className={fieldErrors.title ? 'border-red-300 focus:border-red-500' : ''}
        />
        {fieldErrors.title && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{fieldErrors.title}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">รายละเอียด (ไม่บังคับ)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการฝึกซ้อม"
          disabled={loading}
          rows={3}
        />
      </div>

      {/* Session Date */}
      <div className="space-y-2">
        <Label htmlFor="session_date">
          วันที่ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="session_date"
          type="date"
          value={formData.session_date}
          onChange={(e) => {
            setFormData({ ...formData, session_date: e.target.value });
            clearFieldError('session_date');
          }}
          required
          disabled={loading}
          min={new Date().toISOString().split('T')[0]}
          className={fieldErrors.session_date ? 'border-red-300 focus:border-red-500' : ''}
        />
        {fieldErrors.session_date && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{fieldErrors.session_date}</span>
          </div>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">
            เวลาเริ่ม <span className="text-red-500">*</span>
          </Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => {
              setFormData({ ...formData, start_time: e.target.value });
              clearFieldError('start_time');
            }}
            required
            disabled={loading}
            className={fieldErrors.start_time ? 'border-red-300 focus:border-red-500' : ''}
          />
          {fieldErrors.start_time && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{fieldErrors.start_time}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">
            เวลาสิ้นสุด <span className="text-red-500">*</span>
          </Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => {
              setFormData({ ...formData, end_time: e.target.value });
              clearFieldError('end_time');
            }}
            required
            disabled={loading}
            className={fieldErrors.end_time ? 'border-red-300 focus:border-red-500' : ''}
          />
          {fieldErrors.end_time && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{fieldErrors.end_time}</span>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">
          สถานที่ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => {
            setFormData({ ...formData, location: e.target.value });
            clearFieldError('location');
          }}
          placeholder="เช่น สนามฟุตบอล A, ห้องฟิตเนส"
          required
          disabled={loading}
          className={fieldErrors.location ? 'border-red-300 focus:border-red-500' : ''}
        />
        {fieldErrors.location && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{fieldErrors.location}</span>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            ยกเลิก
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังสร้าง...
            </>
          ) : (
            'สร้างตารางฝึกซ้อม'
          )}
        </Button>
      </div>
    </form>
  );
}
