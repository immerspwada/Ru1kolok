'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, X } from 'lucide-react';
import { createProgressReport, publishProgressReport } from '@/lib/progress/actions';
import { useToast } from '@/hooks/useToast';

interface CreateProgressReportDialogProps {
  athleteId: string;
  athleteName: string;
}

export default function CreateProgressReportDialog({
  athleteId,
  athleteName,
}: CreateProgressReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    reportType: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom',
    periodStart: '',
    periodEnd: '',
    title: '',
    summary: '',
    coachComments: '',
  });

  const [highlights, setHighlights] = useState<string[]>(['']);
  const [improvements, setImprovements] = useState<string[]>(['']);

  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.title || !formData.periodStart || !formData.periodEnd) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        description: 'กรุณากรอกชื่อรายงาน และช่วงเวลา',
        variant: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await createProgressReport({
        athleteId,
        reportType: formData.reportType,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        title: formData.title,
        summary: formData.summary || undefined,
        highlights: highlights.filter((h) => h.trim() !== ''),
        areasForImprovement: improvements.filter((i) => i.trim() !== ''),
        coachComments: formData.coachComments || undefined,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Publish if requested
      if (publish && result.data && 'id' in result.data) {
        const publishResult = await publishProgressReport(result.data.id);
        if (!publishResult.success) {
          throw new Error(publishResult.error);
        }
      }

      toast({
        title: publish ? 'เผยแพร่รายงานสำเร็จ' : 'บันทึกรายงานสำเร็จ',
        description: publish
          ? 'นักกีฬาสามารถดูรายงานได้แล้ว'
          : 'รายงานถูกบันทึกเป็นแบบร่าง',
      });

      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างรายงานได้',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      reportType: 'monthly',
      periodStart: '',
      periodEnd: '',
      title: '',
      summary: '',
      coachComments: '',
    });
    setHighlights(['']);
    setImprovements(['']);
  };

  const addHighlight = () => {
    setHighlights([...highlights, '']);
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  const addImprovement = () => {
    setImprovements([...improvements, '']);
  };

  const removeImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };

  const updateImprovement = (index: number, value: string) => {
    const newImprovements = [...improvements];
    newImprovements[index] = value;
    setImprovements(newImprovements);
  };

  // Auto-generate title based on report type and period
  const generateTitle = () => {
    if (formData.periodStart && formData.reportType) {
      const date = new Date(formData.periodStart);
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      const typeLabels: Record<string, string> = {
        weekly: 'รายสัปดาห์',
        monthly: 'รายเดือน',
        quarterly: 'รายไตรมาส',
        yearly: 'รายปี',
        custom: 'รายงาน',
      };
      
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear() + 543;
      
      return `รายงานความก้าวหน้า${typeLabels[formData.reportType]} - ${month} ${year}`;
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          สร้างรายงานความก้าวหน้า
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างรายงานความก้าวหน้า</DialogTitle>
          <DialogDescription>
            สร้างรายงานความก้าวหน้าสำหรับ {athleteName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="reportType">ประเภทรายงาน</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value: any) =>
                setFormData({ ...formData, reportType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                <SelectItem value="monthly">รายเดือน</SelectItem>
                <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                <SelectItem value="yearly">รายปี</SelectItem>
                <SelectItem value="custom">กำหนดเอง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodStart">วันที่เริ่มต้น</Label>
              <Input
                id="periodStart"
                type="date"
                value={formData.periodStart}
                onChange={(e) =>
                  setFormData({ ...formData, periodStart: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">วันที่สิ้นสุด</Label>
              <Input
                id="periodEnd"
                type="date"
                value={formData.periodEnd}
                onChange={(e) =>
                  setFormData({ ...formData, periodEnd: e.target.value })
                }
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">ชื่อรายงาน</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFormData({ ...formData, title: generateTitle() })
                }
              >
                สร้างชื่ออัตโนมัติ
              </Button>
            </div>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="เช่น รายงานความก้าวหน้ารายเดือน - มกราคม 2568"
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">สรุปภาพรวม</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              placeholder="สรุปภาพรวมความก้าวหน้าของนักกีฬาในช่วงเวลานี้"
              rows={3}
            />
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>จุดเด่น</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHighlight}
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่ม
              </Button>
            </div>
            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={highlight}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                    placeholder="เช่น เข้าฝึกสม่ำเสมอ 95%"
                  />
                  {highlights.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHighlight(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>จุดที่ควรพัฒนา</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImprovement}
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่ม
              </Button>
            </div>
            <div className="space-y-2">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={improvement}
                    onChange={(e) => updateImprovement(index, e.target.value)}
                    placeholder="เช่น ควรฝึกความแข็งแรงของขามากขึ้น"
                  />
                  {improvements.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImprovement(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coach Comments */}
          <div className="space-y-2">
            <Label htmlFor="coachComments">ความคิดเห็นจากโค้ช</Label>
            <Textarea
              id="coachComments"
              value={formData.coachComments}
              onChange={(e) =>
                setFormData({ ...formData, coachComments: e.target.value })
              }
              placeholder="ความคิดเห็นและคำแนะนำเพิ่มเติมจากโค้ช"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            บันทึกแบบร่าง
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? 'กำลังสร้าง...' : 'สร้างและเผยแพร่'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
