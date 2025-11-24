'use client';

/**
 * Admin Create User Page
 * 
 * Features:
 * - Create new user accounts (bypasses rate limiting)
 * - Select user role (admin, coach, athlete)
 * - Assign to club (for coach/athlete)
 * - Auto-generate secure password or custom password
 * - Create profile and related records automatically
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle2, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface FormData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'coach' | 'athlete';
  club_id?: string;
}

export default function CreateUserPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: generatePassword(),
    full_name: '',
    role: 'athlete',
  });
  const [createdUser, setCreatedUser] = useState<{
    email: string;
    password: string;
    role: string;
  } | null>(null);

  function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  function handleGeneratePassword() {
    setFormData({ ...formData, password: generatePassword() });
    toast({
      title: 'สร้างรหัสผ่านใหม่',
      description: 'รหัสผ่านถูกสร้างขึ้นแล้ว',
    });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'คัดลอกแล้ว',
      description: `${label} ถูกคัดลอกไปยังคลิปบอร์ด`,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.full_name) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        description: 'ต้องระบุอีเมล รหัสผ่าน และชื่อ-นามสกุล',
        variant: 'error',
      });
      return;
    }

    setLoading(true);
    setCreatedUser(null);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          club_id: formData.club_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถสร้างผู้ใช้ได้');
      }

      toast({
        title: 'สร้างผู้ใช้สำเร็จ! 🎉',
        description: `สร้างบัญชี ${formData.email} เรียบร้อยแล้ว`,
      });

      // Save created user info for display
      setCreatedUser({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // Reset form
      setFormData({
        email: '',
        password: generatePassword(),
        full_name: '',
        role: 'athlete',
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างผู้ใช้ได้',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">สร้างบัญชีผู้ใช้</h1>
        <p className="text-gray-600 mt-1">
          สร้างบัญชีผู้ใช้ใหม่สำหรับ Admin, Coach, หรือ Athlete
        </p>
      </div>

      {/* Success Message */}
      {createdUser && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium text-green-800">
                ✅ สร้างบัญชีสำเร็จ!
              </p>
              <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">อีเมล:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-medium">{createdUser.email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUser.email, 'อีเมล')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">รหัสผ่าน:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-medium">{createdUser.password}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUser.password, 'รหัสผ่าน')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">บทบาท:</span>
                  <span className="font-medium capitalize">{createdUser.role}</span>
                </div>
              </div>
              <p className="text-xs text-green-700">
                💡 กรุณาส่งข้อมูล login ให้ผู้ใช้ และแนะนำให้เปลี่ยนรหัสผ่านหลัง login
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            ข้อมูลผู้ใช้
          </CardTitle>
          <CardDescription>
            กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่ (ไม่ถูก rate limit)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                อีเมล <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="ชื่อ นามสกุล"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                บทบาท <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'coach' | 'athlete') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="athlete">Athlete (นักกีฬา)</SelectItem>
                  <SelectItem value="coach">Coach (โค้ช)</SelectItem>
                  <SelectItem value="admin">Admin (ผู้ดูแลระบบ)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.role === 'athlete' && '• นักกีฬา: สามารถดูตารางฝึก เช็คอิน และดูผลการฝึก'}
                {formData.role === 'coach' && '• โค้ช: สามารถจัดการตารางฝึก บันทึกผลการฝึก และอนุมัติใบสมัคร'}
                {formData.role === 'admin' && '• Admin: มีสิทธิ์เต็มในการจัดการระบบทั้งหมด'}
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                รหัสผ่าน <span className="text-red-500">*</span>
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  title="สร้างรหัสผ่านใหม่"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                💡 คลิกปุ่มรีเฟรชเพื่อสร้างรหัสผ่านแบบสุ่มที่ปลอดภัย
              </p>
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <p className="font-medium mb-2">📝 หมายเหตุ:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>บัญชีจะถูกสร้างทันที ไม่ถูก rate limit</li>
                  <li>Profile และ records ที่เกี่ยวข้องจะถูกสร้างอัตโนมัติ</li>
                  <li>ผู้ใช้สามารถ login และเปลี่ยนรหัสผ่านได้ทันที</li>
                  <li>สำหรับ Coach/Athlete จะถูก assign ให้กับ club แรกในระบบ</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formData.email || !formData.full_name || !formData.password}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังสร้างบัญชี...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  สร้างบัญชีผู้ใช้
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 คำแนะนำ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">🔐 ความปลอดภัย</p>
            <p className="text-gray-600">
              ใช้รหัสผ่านที่แข็งแรง (อย่างน้อย 8 ตัวอักษร) และส่งข้อมูล login ผ่านช่องทางที่ปลอดภัย
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">👥 บทบาทผู้ใช้</p>
            <p className="text-gray-600">
              เลือกบทบาทที่เหมาะสมกับหน้าที่ของผู้ใช้ เพื่อให้มีสิทธิ์การเข้าถึงที่ถูกต้อง
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">📧 หลังสร้างบัญชี</p>
            <p className="text-gray-600">
              ส่งข้อมูล login (อีเมล + รหัสผ่าน) ให้ผู้ใช้ และแนะนำให้เปลี่ยนรหัสผ่านหลัง login ครั้งแรก
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
