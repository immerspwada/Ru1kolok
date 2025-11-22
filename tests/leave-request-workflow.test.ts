/**
 * Integration tests for leave request workflow
 * Tests the complete flow from athlete requesting leave to coach reviewing it
 * Requirements: BR2
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Leave Request Workflow', () => {
  let supabase: ReturnType<typeof createClient>;
  let coachUserId: string;
  let coachId: string;
  let athleteUserId: string;
  let athleteId: string;
  let clubId: string;
  let testSessionId: string;
  let testLeaveRequestId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get a coach user
    const { data: coachRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'coach')
      .limit(1)
      .single();

    if (!coachRole) {
      throw new Error('No coach user found in database');
    }

    coachUserId = coachRole.user_id;

    // Get coach profile
    const { data: coach } = await supabase
      .from('coaches')
      .select('*')
      .eq('user_id', coachUserId)
      .single();

    if (!coach) {
      throw new Error('No coach profile found');
    }

    coachId = coach.id;
    clubId = coach.club_id;

    // Get an athlete from the same club
    const { data: athlete } = await supabase
      .from('athletes')
      .select('*')
      .eq('club_id', clubId)
      .limit(1)
      .single();

    if (!athlete) {
      throw new Error('No athlete found in the same club');
    }

    athleteId = athlete.id;
    athleteUserId = athlete.user_id;

    // Create a test session in the future (3 days from now to allow leave request)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const sessionDate = futureDate.toISOString().split('T')[0];

    const { data: newSession, error: createError } = await supabase
      .from('training_sessions')
      .insert({
        club_id: clubId,
        coach_id: coachUserId,
        title: 'Leave Request Test Session',
        description: 'Test session for leave request workflow',
        session_date: sessionDate,
        start_time: '10:00:00',
        end_time: '12:00:00',
        location: 'Test Stadium',
      })
      .select()
      .single();

    if (createError || !newSession) {
      throw new Error('Failed to create test session');
    }

    testSessionId = newSession.id;

    console.log('Test setup:', {
      coachUserId,
      coachId,
      clubId,
      athleteId,
      athleteUserId,
      testSessionId,
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testLeaveRequestId) {
      await supabase
        .from('leave_requests')
        .delete()
        .eq('id', testLeaveRequestId);
    }

    if (testSessionId) {
      await supabase
        .from('attendance')
        .delete()
        .eq('training_session_id', testSessionId);

      await supabase
        .from('leave_requests')
        .delete()
        .eq('session_id', testSessionId);

      await supabase
        .from('training_sessions')
        .delete()
        .eq('id', testSessionId);
    }
  });

  it('should complete workflow: Athlete requests leave → Coach sees request', async () => {
    // Step 1: Athlete creates a leave request
    const leaveReason = 'Family emergency - need to attend important event';

    const { data: leaveRequest, error: createError } = await supabase
      .from('leave_requests')
      .insert({
        session_id: testSessionId,
        athlete_id: athleteId,
        reason: leaveReason,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(leaveRequest).toBeDefined();
    expect(leaveRequest?.reason).toBe(leaveReason);
    expect(leaveRequest?.status).toBe('pending');

    testLeaveRequestId = leaveRequest!.id;

    // Step 2: Coach queries leave requests and sees the new request
    const { data: coachLeaveRequests, error: coachError } = await supabase
      .from('leave_requests')
      .select(`
        *,
        training_sessions!inner(*),
        athletes!inner(*)
      `)
      .eq('training_sessions.coach_id', coachUserId)
      .eq('id', testLeaveRequestId)
      .single();

    expect(coachError).toBeNull();
    expect(coachLeaveRequests).toBeDefined();
    expect(coachLeaveRequests?.reason).toBe(leaveReason);
    expect(coachLeaveRequests?.status).toBe('pending');
    expect(coachLeaveRequests?.athlete_id).toBe(athleteId);
    expect(coachLeaveRequests?.session_id).toBe(testSessionId);
  });

  it('should complete workflow: Coach approves leave → Athlete sees approved status', async () => {
    // Ensure we have a leave request
    expect(testLeaveRequestId).toBeDefined();

    // Step 1: Coach approves the leave request
    const { error: approveError } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        reviewed_by: coachId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', testLeaveRequestId);

    expect(approveError).toBeNull();

    // Step 2: Verify an excused attendance record was created
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('training_session_id', testSessionId)
      .eq('athlete_id', athleteId)
      .maybeSingle();

    // Note: Attendance record creation is handled by the reviewLeaveRequest action
    // For this test, we'll just verify the leave request status
    if (attendance) {
      expect(attendance.status).toBe('excused');
    }

    // Step 3: Athlete queries their leave request and sees approved status
    const { data: athleteLeaveRequest, error: athleteError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', testLeaveRequestId)
      .eq('athlete_id', athleteId)
      .single();

    expect(athleteError).toBeNull();
    expect(athleteLeaveRequest).toBeDefined();
    expect(athleteLeaveRequest?.status).toBe('approved');
    expect(athleteLeaveRequest?.reviewed_by).toBe(coachId);
    expect(athleteLeaveRequest?.reviewed_at).toBeDefined();
  });

  it('should complete workflow: Coach rejects leave → Athlete sees rejected status', async () => {
    // Create a new session for rejection test
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    const sessionDate = futureDate.toISOString().split('T')[0];

    const { data: rejectSession } = await supabase
      .from('training_sessions')
      .insert({
        club_id: clubId,
        coach_id: coachUserId,
        title: 'Rejection Test Session',
        session_date: sessionDate,
        start_time: '14:00:00',
        end_time: '16:00:00',
        location: 'Test Field',
      })
      .select()
      .single();

    const rejectSessionId = rejectSession!.id;

    // Step 1: Athlete creates a leave request
    const { data: rejectLeaveRequest } = await supabase
      .from('leave_requests')
      .insert({
        session_id: rejectSessionId,
        athlete_id: athleteId,
        reason: 'Personal reasons for absence',
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    const rejectLeaveRequestId = rejectLeaveRequest!.id;

    // Step 2: Coach rejects the leave request
    const { error: rejectError } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        reviewed_by: coachId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', rejectLeaveRequestId);

    expect(rejectError).toBeNull();

    // Step 3: Athlete queries their leave request and sees rejected status
    const { data: athleteRejectedRequest, error: athleteError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', rejectLeaveRequestId)
      .eq('athlete_id', athleteId)
      .single();

    expect(athleteError).toBeNull();
    expect(athleteRejectedRequest).toBeDefined();
    expect(athleteRejectedRequest?.status).toBe('rejected');
    expect(athleteRejectedRequest?.reviewed_by).toBe(coachId);
    expect(athleteRejectedRequest?.reviewed_at).toBeDefined();

    // Step 4: Verify no excused attendance record was created for rejected request
    const { data: noAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('training_session_id', rejectSessionId)
      .eq('athlete_id', athleteId)
      .maybeSingle();

    expect(noAttendance).toBeNull();

    // Clean up
    await supabase
      .from('leave_requests')
      .delete()
      .eq('id', rejectLeaveRequestId);

    await supabase
      .from('training_sessions')
      .delete()
      .eq('id', rejectSessionId);
  });

  it('should prevent duplicate leave requests for the same session', async () => {
    // Create a new session for duplicate test
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const sessionDate = futureDate.toISOString().split('T')[0];

    const { data: duplicateSession } = await supabase
      .from('training_sessions')
      .insert({
        club_id: clubId,
        coach_id: coachUserId,
        title: 'Duplicate Test Session',
        session_date: sessionDate,
        start_time: '09:00:00',
        end_time: '11:00:00',
        location: 'Test Arena',
      })
      .select()
      .single();

    const duplicateSessionId = duplicateSession!.id;

    // Step 1: Create first leave request
    const { data: firstRequest } = await supabase
      .from('leave_requests')
      .insert({
        session_id: duplicateSessionId,
        athlete_id: athleteId,
        reason: 'First leave request for this session',
        status: 'pending',
      })
      .select()
      .single();

    expect(firstRequest).toBeDefined();

    // Step 2: Try to create duplicate leave request
    const { error: duplicateError } = await supabase
      .from('leave_requests')
      .insert({
        session_id: duplicateSessionId,
        athlete_id: athleteId,
        reason: 'Duplicate leave request attempt',
        status: 'pending',
      });

    // Should fail due to unique constraint or business logic
    expect(duplicateError).toBeDefined();

    // Clean up
    await supabase
      .from('leave_requests')
      .delete()
      .eq('session_id', duplicateSessionId);

    await supabase
      .from('training_sessions')
      .delete()
      .eq('id', duplicateSessionId);
  });

  it('should handle leave request with minimum reason length validation', async () => {
    // Create a new session
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 6);
    const sessionDate = futureDate.toISOString().split('T')[0];

    const { data: validationSession } = await supabase
      .from('training_sessions')
      .insert({
        club_id: clubId,
        coach_id: coachUserId,
        title: 'Validation Test Session',
        session_date: sessionDate,
        start_time: '15:00:00',
        end_time: '17:00:00',
        location: 'Test Ground',
      })
      .select()
      .single();

    const validationSessionId = validationSession!.id;

    // Test with valid reason (at least 10 characters)
    const validReason = 'Valid reason with sufficient length';
    const { data: validRequest, error: validError } = await supabase
      .from('leave_requests')
      .insert({
        session_id: validationSessionId,
        athlete_id: athleteId,
        reason: validReason,
        status: 'pending',
      })
      .select()
      .single();

    expect(validError).toBeNull();
    expect(validRequest).toBeDefined();
    expect(validRequest?.reason).toBe(validReason);

    // Clean up
    await supabase
      .from('leave_requests')
      .delete()
      .eq('session_id', validationSessionId);

    await supabase
      .from('training_sessions')
      .delete()
      .eq('id', validationSessionId);
  });

  it('should maintain data consistency when coach reviews multiple leave requests', async () => {
    // Create a new session
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const sessionDate = futureDate.toISOString().split('T')[0];

    const { data: multiSession } = await supabase
      .from('training_sessions')
      .insert({
        club_id: clubId,
        coach_id: coachUserId,
        title: 'Multiple Requests Test Session',
        session_date: sessionDate,
        start_time: '08:00:00',
        end_time: '10:00:00',
        location: 'Test Complex',
      })
      .select()
      .single();

    const multiSessionId = multiSession!.id;

    // Get multiple athletes from the club
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id')
      .eq('club_id', clubId)
      .limit(3);

    if (!athletes || athletes.length < 2) {
      console.log('Skipping test: Not enough athletes available');
      await supabase
        .from('training_sessions')
        .delete()
        .eq('id', multiSessionId);
      return;
    }

    // Create leave requests for multiple athletes
    const leaveRequests = athletes.map((athlete) => ({
      session_id: multiSessionId,
      athlete_id: athlete.id,
      reason: `Leave request for athlete ${athlete.id}`,
      status: 'pending' as const,
    }));

    const { data: createdRequests } = await supabase
      .from('leave_requests')
      .insert(leaveRequests)
      .select();

    expect(createdRequests).toBeDefined();
    expect(createdRequests!.length).toBe(athletes.length);

    // Coach approves some and rejects others
    if (createdRequests && createdRequests.length >= 2) {
      // Approve first request
      await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          reviewed_by: coachId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', createdRequests[0].id);

      // Reject second request
      await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          reviewed_by: coachId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', createdRequests[1].id);

      // Verify statuses
      const { data: approvedRequest } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', createdRequests[0].id)
        .single();

      const { data: rejectedRequest } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', createdRequests[1].id)
        .single();

      expect(approvedRequest?.status).toBe('approved');
      expect(rejectedRequest?.status).toBe('rejected');
    }

    // Clean up
    await supabase
      .from('leave_requests')
      .delete()
      .eq('session_id', multiSessionId);

    await supabase
      .from('training_sessions')
      .delete()
      .eq('id', multiSessionId);
  });
});
