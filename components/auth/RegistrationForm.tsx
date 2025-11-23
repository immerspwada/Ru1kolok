'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { signUp } from '@/lib/auth/actions';
import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateDateOfBirth,
  validateRequired,
} from '@/lib/auth/validation';

interface Club {
  id: string;
  name: string;
  sport_type: string;
}

interface RegistrationFormProps {
  clubs: Club[];
}

export function RegistrationForm({ clubs }: RegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    nickname: '',
    dateOfBirth: '',
    phoneNumber: '',
    gender: '',
    clubId: '',
    healthNotes: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    const firstNameValidation = validateRequired(formData.firstName, 'ชื่อ');
    if (!firstNameValidation.isValid) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }

    const lastNameValidation = validateRequired(formData.lastName, 'นามสกุล');
    if (!lastNameValidation.isValid) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    const dobValidation = validateDateOfBirth(formData.dateOfBirth);
    if (!dobValidation.isValid) {
      newErrors.dateOfBirth = dobValidation.errors[0];
    }

    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber = phoneValidation.errors[0];
    }

    if (!formData.gender) {
      newErrors.gender = 'กรุณาเลือกเพศ';
    }

    if (!formData.clubId) {
      newErrors.clubId = 'กรุณาเลือกกีฬา';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>สมัครสมาชิกนักกีฬา</CardTitle>
        <CardDescription>
          ขั้นตอนที่ {step} จาก 2: {step === 1 ? 'ข้อมูลบัญชี' : 'ข้อมูลส่วนตัว'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
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
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
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
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="button" onClick={handleNext} className="w-full">
                ถัดไป
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">ชื่อ</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="สมชาย"
                    required
                  />
                  {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">นามสกุล</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="ใจดี"
                    required
                  />
                  {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">ชื่อเล่น (ไม่บังคับ)</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="ชาย"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">วันเกิด</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">เพศ</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                      <SelectItem value="other">อื่นๆ</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="081-234-5678"
                  required
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clubId">เลือกกีฬา</Label>
                <Select value={formData.clubId} onValueChange={(value) => setFormData({ ...formData, clubId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกีฬาที่ต้องการสมัคร" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name} ({club.sport_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clubId && <p className="text-sm text-red-600">{errors.clubId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthNotes">ข้อมูลสุขภาพ (ไม่บังคับ)</Label>
                <Input
                  id="healthNotes"
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  placeholder="โรคประจำตัว หรือ อาการแพ้..."
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  ย้อนกลับ
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
                </Button>
              </div>
            </>
          )}
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
