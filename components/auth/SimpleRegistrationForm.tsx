'use client';

/**
 * Simple Registration Form - Account Creation Only
 * 
 * This form only creates a user account (email + password).
 * After successful registration, users will be redirected to the
 * membership registration page to apply for sports clubs.
 * 
 * Flow:
 * 1. User creates account here (/register)
 * 2. Verify email with OTP
 * 3. Redirect to /register-membership to apply for sports
 * 4. Coach approves application
 * 5. Athlete profile is created
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signUp } from '@/lib/auth/actions';
import { validateEmail, validatePassword } from '@/lib/auth/validation';
import { Loader2 } from 'lucide-react';

export function SimpleRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors[0];
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign up with Supabase Auth
      const result = await signUp(formData.email, formData.password);

      if (!result.success) {
        setError(result.error || 'การสมัครสมาชิกล้มเหลว');
        setLoading(false);
        return;
      }

      // Redirect to OTP verification
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch {
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>สร้างบัญชีผู้ใช้</CardTitle>
        <CardDescription>
          สร้างบัญชีเพื่อเริ่มต้นสมัครเข้าร่วมกีฬา
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              required
              disabled={loading}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              disabled={loading}
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            <p className="text-xs text-gray-500">
              รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 หลังจากสร้างบัญชีเสร็จ คุณจะต้องยืนยันอีเมลและสมัครเข้าร่วมกีฬา
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังสร้างบัญชี...
              </>
            ) : (
              'สร้างบัญชี'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          มีบัญชีอยู่แล้ว?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            เข้าสู่ระบบ
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
