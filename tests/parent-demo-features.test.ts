/**
 * Integration tests for parent features with demo data
 * Tests that demo parent can login and view connected athlete data
 * 
 * Requirements: 1.4, 4.1, 4.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Demo user IDs from 117-comprehensive-demo-data.sql
const DEMO_CLUB_ID = 'd1e2f3a4-b5c6-7890-abcd-ef1234567890';
const DEMO_ATHLETE_USER_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const DEMO_PARENT_USER_ID = 'd4e5f6a7-b8c9-0123-def0-234567890123';
const DEMO_PARENT_EMAIL = 'demo.parent@clubdee.com';
const DEMO_PARENT_PASSWORD = 'Demo123456!';

describe('Parent Demo Features - Task 7', () => {
  let supabase: ReturnType<typeof createClient>;
  let demoAthleteId: string;
  let demoParentUserId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get demo athlete ID from athletes table
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id, club_id')
      .eq('user_id', DEMO_ATHLETE_USER_ID)
      .single();

    if (!athlete) {
      throw new Error('Demo athlete not found. Ensure demo data is set up.');
    }
    demoAthleteId = athlete.id;

    // Get demo parent user ID
    const { data: parentUser } = await supabase
      .from('parent_users')
      .select('id')
      .eq('email', DEMO_PARENT_EMAIL)
      .single();

    if (!parentUser) {
      throw new Error('Demo parent user not found. Ensure demo data is set up.');
    }
    demoParentUserId = parentUser.id;
  });

  describe('7.1 Create parent login functionality test', () => {
    it('should have demo parent user in parent_users table', async () => {
      const { data: parentUser, error } = await supabase
        .from('parent_users')
        .select('id, email, is_active, login_count')
        .eq('email', DEMO_PARENT_EMAIL)
        .single();

      expect(error).toBeNull();
      expect(parentUser).toBeDefined();
      expect(parentUser?.email).toBe(DEMO_PARENT_EMAIL);
      expect(parentUser?.is_active).toBe(true);
    });

    it('should have valid password hash for demo parent', async () => {
      const { data: parentUser, error } = await supabase
        .from('parent_users')
        .select('password_hash')
        .eq('email', DEMO_PARENT_EMAIL)
        .single();

      expect(error).toBeNull();
      expect(parentUser).toBeDefined();
      expect(parentUser?.password_hash).toBeDefined();

      // Verify password hash is a valid bcrypt hash format
      // bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
      const bcryptPattern = /^\$2[aby]\$\d{2}\$.{53}$/;
      expect(bcryptPattern.test(parentUser!.password_hash)).toBe(true);
    });

    it('should be able to create a session for demo parent', async () => {
      // Simulate login by creating a session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { data: session, error } = await supabase
        .from('parent_sessions')
        .insert({
          parent_user_id: demoParentUserId,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(session).toBeDefined();
      expect(session?.parent_user_id).toBe(demoParentUserId);
      expect(session?.is_active).toBe(true);

      // Clean up test session
      await supabase
        .from('parent_sessions')
        .delete()
        .eq('id', session!.id);
    });

    it('should update login count on successful login', async () => {
      // Get current login count
      const { data: beforeLogin } = await supabase
        .from('parent_users')
        .select('login_count')
        .eq('id', demoParentUserId)
        .single();

      const currentCount = beforeLogin?.login_count || 0;

      // Simulate login by updating login count
      const { error } = await supabase
        .from('parent_users')
        .update({
          login_count: currentCount + 1,
          last_login_at: new Date().toISOString(),
        })
        .eq('id', demoParentUserId);

      expect(error).toBeNull();

      // Verify login count increased
      const { data: afterLogin } = await supabase
        .from('parent_users')
        .select('login_count, last_login_at')
        .eq('id', demoParentUserId)
        .single();

      expect(afterLogin?.login_count).toBe(currentCount + 1);
      expect(afterLogin?.last_login_at).toBeDefined();
    });

    it('should have parent connection to demo athlete', async () => {
      const { data: connection, error } = await supabase
        .from('parent_connections')
        .select('*')
        .eq('parent_user_id', demoParentUserId)
        .eq('athlete_id', demoAthleteId)
        .single();

      expect(error).toBeNull();
      expect(connection).toBeDefined();
      expect(connection?.is_verified).toBe(true);
      expect(connection?.is_active).toBe(true);
    });
  });

  describe('7.2 Verify parent can see connected athlete data', () => {
    it('should have parent connection with athlete information', async () => {
      const { data: connection, error } = await supabase
        .from('parent_connections')
        .select(`
          *,
          athletes (
            id,
            first_name,
            last_name,
            email,
            club_id
          )
        `)
        .eq('parent_user_id', demoParentUserId)
        .eq('is_verified', true)
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(connection).toBeDefined();
      expect(connection!.length).toBeGreaterThan(0);

      // Verify athlete data is accessible
      const athleteConnection = connection![0];
      expect(athleteConnection.athletes).toBeDefined();
      expect((athleteConnection.athletes as any)?.club_id).toBe(DEMO_CLUB_ID);
    });

    it('should be able to view athlete attendance records', async () => {
      // Parent should be able to see attendance for connected athlete
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
          *,
          training_sessions (
            id,
            title,
            session_date,
            club_id
          )
        `)
        .eq('athlete_id', DEMO_ATHLETE_USER_ID)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(attendance).toBeDefined();
      expect(attendance!.length).toBeGreaterThan(0);

      // Verify attendance records are from the demo club
      for (const record of attendance!) {
        expect(record.training_sessions).toBeDefined();
        expect((record.training_sessions as any)?.club_id).toBe(DEMO_CLUB_ID);
      }
    });

    it('should be able to view athlete performance records', async () => {
      // Parent should be able to see performance records for connected athlete
      const { data: performanceRecords, error } = await supabase
        .from('performance_records')
        .select(`
          *,
          coaches (
            first_name,
            last_name
          )
        `)
        .eq('athlete_id', demoAthleteId)
        .order('test_date', { ascending: false });

      expect(error).toBeNull();
      expect(performanceRecords).toBeDefined();
      expect(performanceRecords!.length).toBeGreaterThan(0);
    });

    it('should be able to view athlete goals', async () => {
      // Parent should be able to see goals for connected athlete
      const { data: goals, error } = await supabase
        .from('athlete_goals')
        .select('*')
        .eq('athlete_id', demoAthleteId)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(goals).toBeDefined();
      expect(goals!.length).toBeGreaterThan(0);

      // Verify goals have expected fields
      for (const goal of goals!) {
        expect(goal.title).toBeDefined();
        expect(goal.status).toBeDefined();
      }
    });

    it('should have parent notifications for connected athlete', async () => {
      // Get parent connection ID
      const { data: connection } = await supabase
        .from('parent_connections')
        .select('id')
        .eq('parent_user_id', demoParentUserId)
        .eq('athlete_id', demoAthleteId)
        .single();

      if (!connection) {
        throw new Error('Parent connection not found');
      }

      // Check for parent notifications
      const { data: notifications, error } = await supabase
        .from('parent_notifications')
        .select('*')
        .eq('parent_connection_id', connection.id)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(notifications).toBeDefined();
      expect(notifications!.length).toBeGreaterThan(0);

      // Verify notifications have expected fields
      for (const notification of notifications!) {
        expect(notification.type).toBeDefined();
        expect(notification.title).toBeDefined();
        expect(notification.message).toBeDefined();
      }
    });

    it('should calculate correct attendance statistics for parent view', async () => {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('athlete_id', DEMO_ATHLETE_USER_ID);

      expect(error).toBeNull();
      expect(attendance).toBeDefined();

      // Calculate stats (same logic as parent dashboard)
      const totalSessions = attendance!.length;
      const presentCount = attendance!.filter(a => a.status === 'present').length;
      const lateCount = attendance!.filter(a => a.status === 'late').length;

      // Attendance rate = (present + late) / total * 100
      const attendanceRate = totalSessions > 0
        ? Math.round(((presentCount + lateCount) / totalSessions) * 100)
        : 0;

      expect(totalSessions).toBeGreaterThan(0);
      expect(attendanceRate).toBeGreaterThanOrEqual(0);
      expect(attendanceRate).toBeLessThanOrEqual(100);
    });

    it('should verify parent notification preferences are set', async () => {
      const { data: connection, error } = await supabase
        .from('parent_connections')
        .select(`
          notify_attendance,
          notify_performance,
          notify_leave_requests,
          notify_announcements,
          notify_goals,
          notification_frequency
        `)
        .eq('parent_user_id', demoParentUserId)
        .eq('athlete_id', demoAthleteId)
        .single();

      expect(error).toBeNull();
      expect(connection).toBeDefined();

      // Demo data should have all notifications enabled
      expect(connection?.notify_attendance).toBe(true);
      expect(connection?.notify_performance).toBe(true);
      expect(connection?.notify_leave_requests).toBe(true);
      expect(connection?.notify_announcements).toBe(true);
      expect(connection?.notify_goals).toBe(true);
      expect(connection?.notification_frequency).toBe('immediate');
    });
  });
});
