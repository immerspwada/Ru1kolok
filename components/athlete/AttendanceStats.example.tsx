import AttendanceStats from './AttendanceStats';

/**
 * Example usage of AttendanceStats component
 * 
 * This component displays attendance statistics with:
 * - Attendance rate percentage with color-coded progress bar
 * - Counts for present, late, excused, and absent sessions
 * - Visual indicators with icons for each status
 */

export function AttendanceStatsExample() {
  return (
    <div className="space-y-8">
      {/* Example 1: High attendance */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">High Attendance (85%)</h3>
        <AttendanceStats
          totalSessions={20}
          presentCount={15}
          absentCount={2}
          excusedCount={1}
          lateCount={2}
          attendanceRate={85}
        />
      </div>

      {/* Example 2: Medium attendance */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Medium Attendance (65%)</h3>
        <AttendanceStats
          totalSessions={20}
          presentCount={10}
          absentCount={5}
          excusedCount={2}
          lateCount={3}
          attendanceRate={65}
        />
      </div>

      {/* Example 3: Low attendance */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Low Attendance (40%)</h3>
        <AttendanceStats
          totalSessions={20}
          presentCount={5}
          absentCount={12}
          excusedCount={1}
          lateCount={2}
          attendanceRate={40}
        />
      </div>

      {/* Example 4: No sessions yet */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">No Sessions Yet</h3>
        <AttendanceStats
          totalSessions={0}
          presentCount={0}
          absentCount={0}
          excusedCount={0}
          lateCount={0}
          attendanceRate={0}
        />
      </div>
    </div>
  );
}

/**
 * Usage with getAttendanceStats server action:
 * 
 * ```tsx
 * import { getAttendanceStats } from '@/lib/athlete/attendance-actions';
 * import AttendanceStats from '@/components/athlete/AttendanceStats';
 * 
 * export default async function AttendancePage() {
 *   const { data: stats, error } = await getAttendanceStats();
 * 
 *   if (error || !stats) {
 *     return <div>Error loading stats</div>;
 *   }
 * 
 *   return (
 *     <div>
 *       <AttendanceStats {...stats} />
 *     </div>
 *   );
 * }
 * ```
 */
