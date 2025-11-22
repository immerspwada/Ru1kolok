import { SessionForm } from '@/components/coach/SessionForm';

export default function TestSessionFormPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ทดสอบฟอร์มสร้างตารางฝึกซ้อม
          </h1>
          <p className="mt-2 text-gray-600">
            Test page for SessionForm component
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <SessionForm />
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-900">Test Instructions:</h2>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• Fill in all required fields (marked with *)</li>
            <li>• Try selecting a past date - should show error</li>
            <li>• Try setting end time before start time - should show error</li>
            <li>• Submit with valid data - should show success message</li>
            <li>• Form should reset after successful submission</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
