'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { createSession } from '@/lib/coach/session-actions';
import { Loader2 } from 'lucide-react';

interface SessionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SessionForm({ onSuccess, onCancel }: SessionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  // Client-side validation
  const validateForm = (): string | null => {
    // Check required fields
    if (!formData.title.trim()) {
      return 'กรุณากรอกชื่อตารางฝึกซ้อม';
    }

    if (!formData.session_date) {
      return 'กรุณาเลือกวันที่';
    }

    if (!formData.start_time) {
      return 'กรุณาเลือกเวลาเริ่ม';
    }

    if (!formData.end_time) {
      return 'กรุณาเลือกเวลาสิ้นสุด';
    }

    if (!formData.location.trim()) {
      return 'กรุณากรอกสถานที่';
    }

    // Validate date is not in the past
    const sessionDate = new Date(formData.session_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (sessionDate < today) {
      return 'ไม่สามารถสร้างตารางในอดีตได้';
    }

    // Validate start_time < end_time
    if (formData.start_time >= formData.end_time) {
      return 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
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
      setSuccess(true);
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
      setError(result.error || 'เกิดข้อผิดพลาดในการสร้างตารางฝึกซ้อม');
    }

    setLoading(false);
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
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="เช่น ฝึกซ้อมประจำวัน, ฝึกซ้อมพิเศษ"
          required
          disabled={loading}
        />
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
          onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
          required
          disabled={loading}
          min={new Date().toISOString().split('T')[0]}
        />
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
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">
            เวลาสิ้นสุด <span className="text-red-500">*</span>
          </Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
            disabled={loading}
          />
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
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="เช่น สนามฟุตบอล A, ห้องฟิตเนส"
          required
          disabled={loading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-3 border border-green-200">
          <p className="text-sm text-green-600">สร้างตารางฝึกซ้อมสำเร็จ!</p>
        </div>
      )}

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
