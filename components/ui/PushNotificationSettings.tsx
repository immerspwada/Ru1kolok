'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface PushNotificationSettingsProps {
  userId: string;
}

export function PushNotificationSettings({ userId }: PushNotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    error,
  } = usePushNotifications(userId);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await subscribe();
        toast({
          title: 'เปิดการแจ้งเตือนแล้ว',
          description: 'คุณจะได้รับการแจ้งเตือนแบบ push notification',
        });
      } else {
        await unsubscribe();
        toast({
          title: 'ปิดการแจ้งเตือนแล้ว',
          description: 'คุณจะไม่ได้รับการแจ้งเตือนแบบ push notification อีกต่อไป',
        });
      }
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนการตั้งค่าได้',
        variant: 'error',
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-sm">Push Notifications ไม่รองรับ</h3>
            <p className="text-sm text-gray-600 mt-1">
              เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือนแบบ push notification
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <BellOff className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-sm">การแจ้งเตือนถูกปิดใช้งาน</h3>
            <p className="text-sm text-gray-600 mt-1">
              คุณได้ปิดการอนุญาตการแจ้งเตือนสำหรับเว็บไซต์นี้
              กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="push-notifications" className="text-sm font-medium cursor-pointer">
              Push Notifications
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              รับการแจ้งเตือนแบบ real-time สำหรับประกาศและกิจกรรมสำคัญ
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-2">
                {error.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={isLoading}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
