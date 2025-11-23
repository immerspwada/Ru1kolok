# Toast Notification Implementation Guide

## Quick Start

This guide will help you complete the toast notification system for the Training Attendance feature.

## Current Status

✅ **Completed:**
- Installed `@radix-ui/react-toast` package
- Created `hooks/useToast.ts` hook

⏳ **Remaining:**
- Create `components/ui/toast.tsx`
- Create `components/ui/toaster.tsx`
- Update `app/layout.tsx`
- Integrate into components

---

## Step 1: Create Toast Component

**File:** `components/ui/toast.tsx`

```tsx
'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-white text-gray-950',
        success: 'border-green-200 bg-green-50 text-green-900',
        error: 'border-red-200 bg-red-50 text-red-900',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-gray-950/50 opacity-0 transition-opacity hover:text-gray-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
```

---

## Step 2: Create Toaster Component

**File:** `components/ui/toaster.tsx`

```tsx
'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
```

---

## Step 3: Update Root Layout

**File:** `app/layout.tsx`

Add the import and component:

```tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## Step 4: Integrate into Components

### Example 1: SessionForm

**File:** `components/coach/SessionForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { createSession } from '@/lib/coach/session-actions';

export function SessionForm({ onSuccess }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      session_date: formData.get('session_date') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      location: formData.get('location') as string,
    };

    const result = await createSession(data);

    if (result.error) {
      toast({
        variant: 'error',
        title: 'เกิดข้อผิดพลาด',
        description: result.error,
      });
    } else {
      toast({
        variant: 'success',
        title: 'สำเร็จ',
        description: 'สร้างตารางฝึกซ้อมเรียบร้อยแล้ว',
      });
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </form>
  );
}
```

### Example 2: CheckInButton

**File:** `components/athlete/CheckInButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { athleteCheckIn } from '@/lib/athlete/attendance-actions';
import { Button } from '@/components/ui/button';

export function CheckInButton({ sessionId, onSuccess }) {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckIn = async () => {
    setIsChecking(true);

    const result = await athleteCheckIn(sessionId);

    if (result.error) {
      toast({
        variant: 'error',
        title: 'ไม่สามารถเช็คอินได้',
        description: result.error,
      });
    } else {
      toast({
        variant: 'success',
        title: 'เช็คอินสำเร็จ',
        description: 'บันทึกการเข้าร่วมเรียบร้อยแล้ว',
      });
      onSuccess?.();
    }

    setIsChecking(false);
  };

  return (
    <Button onClick={handleCheckIn} disabled={isChecking}>
      {isChecking ? 'กำลังเช็คอิน...' : 'เช็คอิน'}
    </Button>
  );
}
```

### Example 3: LeaveRequestForm

**File:** `components/athlete/LeaveRequestForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { requestLeave } from '@/lib/athlete/attendance-actions';

export function LeaveRequestForm({ sessionId, onSuccess }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await requestLeave({ sessionId, reason });

    if (result.error) {
      toast({
        variant: 'error',
        title: 'ไม่สามารถแจ้งลาได้',
        description: result.error,
      });
    } else {
      toast({
        variant: 'success',
        title: 'แจ้งลาสำเร็จ',
        description: 'ส่งคำขอลาเรียบร้อยแล้ว',
      });
      setReason('');
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="เหตุผลในการลา (อย่างน้อย 10 ตัวอักษร)"
        minLength={10}
        required
      />
      <button type="submit" disabled={isSubmitting || reason.length < 10}>
        {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอลา'}
      </button>
    </form>
  );
}
```

---

## Toast Variants

### Success
```tsx
toast({
  variant: 'success',
  title: 'สำเร็จ',
  description: 'ดำเนินการเรียบร้อยแล้ว',
});
```

### Error
```tsx
toast({
  variant: 'error',
  title: 'เกิดข้อผิดพลาด',
  description: 'กรุณาลองใหม่อีกครั้ง',
});
```

### Warning
```tsx
toast({
  variant: 'warning',
  title: 'คำเตือน',
  description: 'กรุณาตรวจสอบข้อมูล',
});
```

### Default
```tsx
toast({
  title: 'แจ้งเตือน',
  description: 'มีข้อความใหม่',
});
```

---

## Components to Update

### High Priority
1. ✅ SessionForm - Session creation/update
2. ✅ CheckInButton - Check-in feedback
3. ✅ LeaveRequestForm - Leave request
4. ⏳ AttendanceSheet - Attendance marking
5. ⏳ Admin SessionsTable - Edit/delete

### Medium Priority
6. ⏳ ProfileEditForm - Profile updates
7. ⏳ CreateClubDialog - Club creation
8. ⏳ AssignCoachDialog - Coach assignment

---

## Testing Checklist

- [ ] Toast appears on success
- [ ] Toast appears on error
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Toast can be manually dismissed
- [ ] Multiple toasts stack correctly
- [ ] Toast is accessible (keyboard navigation)
- [ ] Toast works on mobile
- [ ] Toast doesn't block UI interaction

---

## Troubleshooting

### Toast doesn't appear
- Check that `<Toaster />` is in root layout
- Verify `useToast` hook is imported correctly
- Check browser console for errors

### Toast styling issues
- Verify Tailwind CSS is configured
- Check that `cn` utility function works
- Inspect element to see applied classes

### Toast doesn't dismiss
- Check that `ToastClose` component is rendered
- Verify timeout is set (default 5000ms)
- Test manual dismiss with X button

---

## Next Steps

1. Create the two component files above
2. Update the root layout
3. Test with a simple example
4. Integrate into SessionForm
5. Integrate into CheckInButton
6. Integrate into LeaveRequestForm
7. Test all integrations
8. Mark Task 6.1 as complete!

---

## Resources

- [Radix UI Toast Docs](https://www.radix-ui.com/primitives/docs/components/toast)
- [shadcn/ui Toast](https://ui.shadcn.com/docs/components/toast)
- Current hook: `hooks/useToast.ts`
- Status doc: `UI_UX_ENHANCEMENTS_STATUS.md`
