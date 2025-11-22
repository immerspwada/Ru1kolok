import AttendanceStats from '@/components/athlete/AttendanceStats';

export default function TestAttendanceStatsPage() {
  // Test data with different scenarios
  const scenarios = [
    {
      title: 'High Attendance (90%)',
      stats: {
        totalSessions: 20,
        presentCount: 16,
        absentCount: 1,
        excusedCount: 1,
        lateCount: 2,
        attendanceRate: 90,
      },
    },
    {
      title: 'Medium Attendance (65%)',
      stats: {
        totalSessions: 20,
        presentCount: 10,
        absentCount: 5,
        excusedCount: 2,
        lateCount: 3,
        attendanceRate: 65,
      },
    },
    {
      title: 'Low Attendance (45%)',
      stats: {
        totalSessions: 20,
        presentCount: 6,
        absentCount: 10,
        excusedCount: 2,
        lateCount: 2,
        attendanceRate: 45,
      },
    },
    {
      title: 'No Sessions Yet',
      stats: {
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        excusedCount: 0,
        lateCount: 0,
        attendanceRate: 0,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AttendanceStats Component Test
          </h1>
          <p className="mt-2 text-gray-600">
            Testing different attendance scenarios
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {scenarios.map((scenario, index) => (
            <div key={index} className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-700">
                {scenario.title}
              </h2>
              <AttendanceStats {...scenario.stats} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
