/**
 * Example usage of AttendanceHistory component
 * 
 * This file demonstrates how to use the AttendanceHistory component
 * with sample data for testing and development purposes.
 */

import AttendanceHistory from './AttendanceHistory';

// Sample attendance records
const sampleRecords = [
  {
    id: '1',
    training_session_id: 'session-1',
    athlete_id: 'athlete-1',
    status: 'present' as const,
    check_in_time: '2024-01-15T15:55:00Z',
    check_in_method: 'manual' as const,
    marked_by: null,
    notes: null,
    created_at: '2024-01-15T15:55:00Z',
    training_sessions: {
      id: 'session-1',
      club_id: 'club-1',
      coach_id: 'coach-1',
      title: 'ฝึกซ้อมประจำวัน',
      description: 'ฝึกซ้อมทักษะพื้นฐาน',
      session_date: '2024-01-15',
      start_time: '16:00:00',
      end_time: '18:00:00',
      location: 'สนามฟุตบอล A',
      max_participants: null,
      status: 'completed' as const,
      qr_code: null,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-15T18:00:00Z',
    },
  },
  {
    id: '2',
    training_session_id: 'session-2',
    athlete_id: 'athlete-1',
    status: 'late' as const,
    check_in_time: '2024-01-14T16:10:00Z',
    check_in_method: 'manual' as const,
    marked_by: null,
    notes: 'มาสาย 10 นาที',
    created_at: '2024-01-14T16:10:00Z',
    training_sessions: {
      id: 'session-2',
      club_id: 'club-1',
      coach_id: 'coach-1',
      title: 'ฝึกซ้อมพิเศษ',
      description: 'ฝึกซ้อมเทคนิคขั้นสูง',
      session_date: '2024-01-14',
      start_time: '16:00:00',
      end_time: '17:30:00',
      location: 'สนามฟุตบอล B',
      max_participants: null,
      status: 'completed' as const,
      qr_code: null,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-14T17:30:00Z',
    },
  },
  {
    id: '3',
    training_session_id: 'session-3',
    athlete_id: 'athlete-1',
    status: 'excused' as const,
    check_in_time: null,
    check_in_method: 'manual' as const,
    marked_by: 'coach-1',
    notes: 'ลาป่วย',
    created_at: '2024-01-13T10:00:00Z',
    training_sessions: {
      id: 'session-3',
      club_id: 'club-1',
      coach_id: 'coach-1',
      title: 'ฝึกซ้อมเช้า',
      description: null,
      session_date: '2024-01-13',
      start_time: '09:00:00',
      end_time: '11:00:00',
      location: 'สนามฟุตบอล A',
      max_participants: null,
      status: 'completed' as const,
      qr_code: null,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-13T11:00:00Z',
    },
  },
  {
    id: '4',
    training_session_id: 'session-4',
    athlete_id: 'athlete-1',
    status: 'absent' as const,
    check_in_time: null,
    check_in_method: 'manual' as const,
    marked_by: 'coach-1',
    notes: 'ไม่มาโดยไม่แจ้ง',
    created_at: '2024-01-12T16:00:00Z',
    training_sessions: {
      id: 'session-4',
      club_id: 'club-1',
      coach_id: 'coach-1',
      title: 'ฝึกซ้อมประจำวัน',
      description: null,
      session_date: '2024-01-12',
      start_time: '16:00:00',
      end_time: '18:00:00',
      location: 'สนามฟุตบอล A',
      max_participants: null,
      status: 'completed' as const,
      qr_code: null,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-12T18:00:00Z',
    },
  },
  {
    id: '5',
    training_session_id: 'session-5',
    athlete_id: 'athlete-1',
    status: 'present' as const,
    check_in_time: '2024-01-11T15:45:00Z',
    check_in_method: 'manual' as const,
    marked_by: null,
    notes: null,
    created_at: '2024-01-11T15:45:00Z',
    training_sessions: {
      id: 'session-5',
      club_id: 'club-1',
      coach_id: 'coach-1',
      title: 'ฝึกซ้อมฟิตเนส',
      description: 'ฝึกความแข็งแรงและความอดทน',
      session_date: '2024-01-11',
      start_time: '16:00:00',
      end_time: '17:00:00',
      location: 'ห้องฟิตเนส',
      max_participants: 20,
      status: 'completed' as const,
      qr_code: null,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-11T17:00:00Z',
    },
  },
];

export default function AttendanceHistoryExample() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          AttendanceHistory Component Example
        </h1>

        {/* With records */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            With Attendance Records
          </h2>
          <AttendanceHistory records={sampleRecords} />
        </div>

        {/* Empty state */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            Empty State
          </h2>
          <AttendanceHistory records={[]} />
        </div>
      </div>
    </div>
  );
}
