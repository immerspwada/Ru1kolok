/**
 * LeaveRequestForm Component - Usage Examples
 * 
 * This file demonstrates how to use the LeaveRequestForm component
 * in different scenarios.
 */

import { LeaveRequestForm } from './LeaveRequestForm';

// Example 1: Basic usage in a session detail page
export function SessionDetailExample() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">แจ้งลาการฝึกซ้อม</h2>
      
      <LeaveRequestForm
        sessionId="session-123"
        sessionTitle="ฝึกซ้อมประจำวัน"
        sessionDate="2024-11-25"
        startTime="16:00:00"
      />
    </div>
  );
}

// Example 2: With custom callbacks
export function WithCallbacksExample() {
  const handleSuccess = () => {
    console.log('Leave request submitted successfully!');
    // You can add custom logic here, like showing a toast notification
  };

  const handleError = (error: string) => {
    console.error('Error submitting leave request:', error);
    // You can add custom error handling here
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <LeaveRequestForm
        sessionId="session-123"
        sessionTitle="ฝึกซ้อมพิเศษ"
        sessionDate="2024-11-26"
        startTime="18:00:00"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}

// Example 3: In a dialog/modal
export function InDialogExample() {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">แจ้งลาการฝึกซ้อม</h3>
        <p className="text-sm text-gray-600 mt-1">
          กรุณาระบุเหตุผลในการลาอย่างน้อย 10 ตัวอักษร
        </p>
      </div>
      
      <LeaveRequestForm
        sessionId="session-123"
        sessionTitle="ฝึกซ้อมเช้า"
        sessionDate="2024-11-27"
        startTime="08:00:00"
        className="mt-4"
      />
    </div>
  );
}

// Example 4: Disabled state (e.g., when session is too soon)
export function DisabledExample() {
  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-700">
          ไม่สามารถแจ้งลาได้เนื่องจากเหลือเวลาน้อยกว่า 2 ชั่วโมง
        </p>
      </div>
      
      <LeaveRequestForm
        sessionId="session-123"
        sessionTitle="ฝึกซ้อมด่วน"
        sessionDate="2024-11-25"
        startTime="14:00:00"
        disabled={true}
      />
    </div>
  );
}

// Example 5: Integration with ScheduleCard
import { useState } from 'react';

export function IntegratedWithScheduleExample() {
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  return (
    <div className="max-w-md mx-auto p-4">
      {!showLeaveForm ? (
        <button
          onClick={() => setShowLeaveForm(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          แจ้งลา
        </button>
      ) : (
        <div className="space-y-4">
          <LeaveRequestForm
            sessionId="session-123"
            sessionTitle="ฝึกซ้อมบ่าย"
            sessionDate="2024-11-28"
            startTime="15:00:00"
            onSuccess={() => {
              setShowLeaveForm(false);
              // Refresh or update UI
            }}
          />
          
          <button
            onClick={() => setShowLeaveForm(false)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      )}
    </div>
  );
}
