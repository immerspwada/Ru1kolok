# Reporting and Data Export System

## Overview

The Reporting and Data Export system provides comprehensive reporting capabilities for coaches and admins, with data export functionality in CSV format. The system respects Row Level Security (RLS) policies to ensure data isolation between clubs.

## Implementation Summary

### Task 13.1: Attendance Report Generator for Coaches ✅

**Files Created:**
- `lib/coach/report-actions.ts` - Server actions for generating attendance reports
- `app/dashboard/coach/reports/page.tsx` - Coach reports page
- `components/coach/AttendanceReportGenerator.tsx` - Report generator UI component

**Features:**
- Date range selection (default: last 30 days)
- Filter by specific athlete or all athletes
- Display attendance statistics in table format:
  - Total sessions
  - Attended, absent, late, excused counts
  - Attendance rate percentage
- Summary statistics cards
- Color-coded attendance rates (green ≥80%, yellow ≥60%, red <60%)
- Restricted to coach's club data only (Requirements 12.1)

**Key Functions:**
- `generateAttendanceReport()` - Generates attendance report for coach's club
  - Validates date range
  - Fetches sessions in date range for coach's club
  - Calculates statistics for each athlete
  - Returns sorted report by attendance rate

### Task 13.3: Data Export Functionality ✅

**Files Created:**
- `components/coach/ExportButton.tsx` - Reusable export button component
- `components/coach/PerformanceDataExport.tsx` - Performance data export UI

**Files Modified:**
- `lib/coach/report-actions.ts` - Added export functions
- `components/coach/AttendanceReportGenerator.tsx` - Added export button
- `app/dashboard/coach/reports/page.tsx` - Added performance export section

**Features:**
- CSV export for attendance reports
- CSV export for performance data
- UTF-8 BOM encoding for proper Thai character display in Excel
- Dropdown menu for export format selection (extensible for PDF)
- Date range and athlete filtering
- Respects RLS policies (coach's club only) (Requirements 12.2, 12.4)

**Key Functions:**
- `exportAttendanceReportCSV()` - Exports attendance report as CSV
- `exportPerformanceDataCSV()` - Exports performance data as CSV
- `getPerformanceDataForExport()` - Fetches performance records for export

**CSV Format:**
- Attendance Report: Name, Nickname, Total Sessions, Attended, Absent, Late, Excused, Attendance Rate
- Performance Data: Test Date, Athlete Name, Nickname, Test Type, Test Name, Score, Unit, Notes

### Task 13.5: System-Wide Reporting for Admins ✅

**Files Created:**
- `lib/admin/report-actions.ts` - Server actions for system-wide reports
- `components/admin/SystemWideReportDashboard.tsx` - Admin report dashboard
- `app/api/admin/clubs/route.ts` - API endpoint for fetching clubs

**Files Modified:**
- `app/dashboard/admin/reports/page.tsx` - Updated with report dashboard

**Features:**
- System-wide statistics aggregation (Requirements 12.3):
  - Total athletes across all clubs
  - Total training sessions
  - Total attendance records
  - Average attendance rate
- Club breakdown table:
  - Club name and sport type
  - Athlete count per club
  - Session count per club
  - Attendance rate per club
- Date range filtering
- Club filtering (all clubs or specific club)
- CSV export of system-wide report
- Summary statistics cards with icons

**Key Functions:**
- `generateSystemWideReport()` - Aggregates data across all clubs
  - Admin-only access verification
  - Fetches all clubs or specific club
  - Calculates statistics per club
  - Returns sorted breakdown by attendance rate
- `exportSystemWideReportCSV()` - Exports system-wide report as CSV

## Data Security

All reporting functions enforce proper authorization:

1. **Coach Reports:**
   - Verify user is authenticated
   - Verify user has coach profile
   - Restrict data to coach's club only
   - RLS policies automatically filter queries

2. **Admin Reports:**
   - Verify user is authenticated
   - Verify user has admin role
   - Access to all clubs' data
   - RLS policies grant full access to admins

## API Endpoints

### GET /api/admin/clubs
- Returns list of all clubs (admin only)
- Used for club selection in admin reports
- Response: `{ clubs: [{ id, name, sport_type }] }`

## User Interface

### Coach Reports Page (`/dashboard/coach/reports`)
- Attendance report generator with parameters
- Performance data export section
- Responsive design for mobile and desktop
- Thai language interface

### Admin Reports Page (`/dashboard/admin/reports`)
- System-wide statistics dashboard
- Summary cards with key metrics
- Club breakdown table
- Export functionality
- Responsive design for mobile and desktop
- Thai language interface

## Technical Details

### Performance Optimizations
- Efficient bulk queries to avoid N+1 problems
- Single query for all sessions in date range
- Single query for all attendance records
- Map-based aggregation for fast lookups

### Data Validation
- Date range validation (start ≤ end)
- Empty data handling
- Error messages in Thai

### Export Format
- CSV with UTF-8 BOM for Excel compatibility
- Quoted fields to handle commas in data
- Descriptive filenames with date suffix
- Blob-based download (no server-side file storage)

## Requirements Validation

✅ **Requirement 12.1:** Attendance report generator for coaches
- Date range selection ✓
- Athlete filtering ✓
- Statistics display ✓
- Restricted to coach's club ✓

✅ **Requirement 12.2:** Data export functionality
- CSV export implemented ✓
- PDF export structure ready (dropdown menu) ✓

✅ **Requirement 12.3:** System-wide reporting for admins
- Aggregate data across all clubs ✓
- Summary statistics ✓
- Date range filtering ✓
- Club filtering ✓

✅ **Requirement 12.4:** RLS policy respect in exports
- Coach exports restricted to own club ✓
- Admin exports access all clubs ✓
- Authorization checks in all functions ✓

## Future Enhancements

1. **PDF Export:**
   - Add PDF generation library (e.g., jsPDF)
   - Implement formatted PDF layouts
   - Add charts and visualizations

2. **Additional Report Types:**
   - Performance trend reports
   - Athlete progress reports
   - Coach activity reports

3. **Scheduled Reports:**
   - Email delivery of reports
   - Automated weekly/monthly reports
   - Report subscriptions

4. **Data Visualization:**
   - Charts and graphs in reports
   - Interactive dashboards
   - Trend analysis visualizations

## Testing

The implementation includes:
- Type safety with TypeScript
- Error handling for all async operations
- Input validation
- Authorization checks
- RLS policy enforcement

Optional property-based tests (tasks 13.2, 13.4, 13.6) can be added for:
- Attendance report accuracy
- Export format compliance
- System-wide aggregation correctness

## Deployment Notes

No database migrations required - uses existing tables:
- `training_sessions`
- `attendance`
- `performance_records`
- `athletes`
- `clubs`

All functionality is server-side rendered with client-side interactivity for better performance and security.
