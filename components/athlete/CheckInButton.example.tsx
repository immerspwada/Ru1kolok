/**
 * Example usage of CheckInButton component
 * 
 * This file demonstrates how to integrate the CheckInButton
 * into your athlete pages.
 */

'use client';

import { CheckInButton } from './CheckInButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Example 1: Basic usage in a session card
export function SessionCardWithCheckIn() {
  const session = {
    id: 'session-123',
    title: 'ฝึกซ้อมประจำวัน',
    session_date: '2024-11-25',
    start_time: '16:00:00',
    end_time: '18:00:00',
    location: 'สนามฟุตบอล A',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{session.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>📅 {session.session_date}</p>
            <p>⏰ {session.start_time} - {session.end_time}</p>
            <p>📍 {session.location}</p>
          </div>

          <CheckInButton
            sessionId={session.id}
            sessionDate={session.session_date}
            startTime={session.start_time}
            sessionTitle={session.title}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Example 2: With custom callbacks
export function SessionCardWithCallbacks() {
  const session = {
    id: 'session-456',
    title: 'ฝึกซ้อมพิเศษ',
    session_date: '2024-11-26',
    start_time: '14:00:00',
  };

  const handleSuccess = () => {
    console.log('Check-in successful!');
    // You can add custom logic here, like:
    // - Show a toast notification
    // - Update local state
    // - Track analytics
  };

  const handleError = (error: string) => {
    console.error('Check-in failed:', error);
    // You can add custom error handling here, like:
    // - Show a custom error dialog
    // - Log to error tracking service
    // - Retry logic
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <CheckInButton
          sessionId={session.id}
          sessionDate={session.session_date}
          startTime={session.start_time}
          sessionTitle={session.title}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </CardContent>
    </Card>
  );
}

// Example 3: Custom styling
export function SessionCardWithCustomStyle() {
  const session = {
    id: 'session-789',
    title: 'ฝึกซ้อมเช้า',
    session_date: '2024-11-27',
    start_time: '08:00:00',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <CheckInButton
          sessionId={session.id}
          sessionDate={session.session_date}
          startTime={session.start_time}
          sessionTitle={session.title}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3"
        />
      </CardContent>
    </Card>
  );
}

// Example 4: Conditional rendering based on attendance status
export function SessionCardWithStatus() {
  const session = {
    id: 'session-101',
    title: 'ฝึกซ้อมบ่าย',
    session_date: '2024-11-28',
    start_time: '15:00:00',
    attendance: null, // or { status: 'present', check_in_time: '...' }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {!session.attendance ? (
          <CheckInButton
            sessionId={session.id}
            sessionDate={session.session_date}
            startTime={session.start_time}
            sessionTitle={session.title}
          />
        ) : (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-green-600 font-medium">
              ✓ เช็คอินแล้ว
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example 5: In a list of sessions
export function SessionsList() {
  const sessions = [
    {
      id: 'session-1',
      title: 'ฝึกซ้อมเช้า',
      session_date: '2024-11-25',
      start_time: '08:00:00',
    },
    {
      id: 'session-2',
      title: 'ฝึกซ้อมบ่าย',
      session_date: '2024-11-25',
      start_time: '16:00:00',
    },
  ];

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <CardTitle>{session.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckInButton
              sessionId={session.id}
              sessionDate={session.session_date}
              startTime={session.start_time}
              sessionTitle={session.title}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
