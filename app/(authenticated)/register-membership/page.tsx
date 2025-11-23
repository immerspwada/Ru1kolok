'use client';

/**
 * Membership Registration Page
 * 
 * This page allows authenticated athletes to submit membership applications
 * to join sports clubs. It renders the multi-step RegistrationForm component
 * and handles the submission flow.
 * 
 * Features:
 * - Authentication check (redirects to /login if not logged in)
 * - Gets current user from Supabase auth
 * - Renders RegistrationForm with userId
 * - Handles success: shows toast and redirects to athlete applications page
 * - Error handling with toast notifications
 * - Loading state during initial auth check
 * 
 * Validates: Requirements US-1.5, NFR-4
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import RegistrationForm from '@/components/membership/RegistrationForm';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function RegisterMembershipPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Not authenticated, redirect to login
      toast({
        title: 'กรุณาเข้าสู่ระบบ',
        description: 'คุณต้องเข้าสู่ระบบก่อนสมัครสมาชิก',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setUserId(user.id);
    setLoading(false);
  }

  function handleSuccess() {
    toast({
      title: 'ส่งใบสมัครสำเร็จ! 🎉',
      description: 'ใบสมัครของคุณถูกส่งเรียบร้อยแล้ว รอการอนุมัติจากโค้ช',
      variant: 'default',
    });

    // Redirect to athlete applications page
    router.push('/dashboard/athlete/applications');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <RegistrationForm userId={userId} onSuccess={handleSuccess} />
    </div>
  );
}
