'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { updateAnnouncement } from '@/lib/coach/announcement-actions';
import { useToast } from '@/hooks/useToast';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_pinned: boolean;
}

interface EditAnnouncementDialogProps {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
}: EditAnnouncementDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: announcement.title,
    message: announcement.message,
    priority: announcement.priority,
    is_pinned: announcement.is_pinned,
  });

  // Update form when announcement changes
  useEffect(() => {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      is_pinned: announcement.is_pinned,
    });
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateAnnouncement({
        id: announcement.id,
        ...formData,
      });

      if (result.success) {
        toast({
          title: 'สำเร็จ',
          description: 'แก้ไขประกาศเรียบร้อยแล้ว',
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถแก้ไขประกาศได้',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถแก้ไขประกาศได้',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>แก้ไขประกาศ</DialogTitle>
            <DialogDescription>
              แก้ไขรายละเอียดประกาศของคุณ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">หัวข้อประกาศ *</Label>
              <Input
                id="edit-title"
                placeholder="เช่น ประกาศเลื่อนการฝึกซ้อม"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="edit-message">รายละเอียด *</Label>
              <Textarea
                id="edit-message"
                placeholder="เขียนรายละเอียดประกาศที่นี่..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {formData.message.length}/5000 ตัวอักษร
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="edit-priority">ระดับความสำคัญ</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="normal">ปกติ</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="urgent">เร่งด่วน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pin Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_pinned"
                checked={formData.is_pinned}
                onChange={(e) =>
                  setFormData({ ...formData, is_pinned: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-is_pinned" className="cursor-pointer">
                ปักหมุดประกาศนี้ไว้ด้านบน
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึกการแก้ไข'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
