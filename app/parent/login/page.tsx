import { ParentLoginForm } from '@/components/parent/ParentLoginForm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getParentSession } from '@/lib/parent-auth/actions';

export default async function ParentLoginPage() {
  // ถ้าล็อกอินอยู่แล้ว redirect ไป dashboard
  const session = await getParentSession();
  if (session) {
    redirect('/parent/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ระบบผู้ปกครอง
          </h1>
          <p className="text-gray-600">
            ติดตามความก้าวหน้าของบุตรหลาน
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <ParentLoginForm />
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            ยังไม่ได้รับอีเมลยืนยัน?{' '}
            <Link href="/contact" className="text-blue-600 hover:underline font-medium">
              ติดต่อสโมสร
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            คุณเป็นนักกีฬา/โค้ช?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              เข้าสู่ระบบหลัก
            </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            💡 วิธีการเข้าใช้งาน
          </h3>
          <ol className="text-xs text-blue-800 space-y-1">
            <li>1. บุตรหลานเพิ่มอีเมลของคุณในระบบ</li>
            <li>2. คุณจะได้รับอีเมลยืนยัน</li>
            <li>3. คลิกลิงก์ในอีเมลเพื่อตั้งรหัสผ่าน</li>
            <li>4. ล็อกอินด้วยอีเมลและรหัสผ่าน</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
