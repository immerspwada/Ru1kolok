'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SessionForm } from './SessionForm';

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    // Close dialog on successful creation
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          สร้างตารางฝึกซ้อม
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างตารางฝึกซ้อมใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลตารางฝึกซ้อมที่ต้องการสร้าง
          </DialogDescription>
        </DialogHeader>
        <SessionForm
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
