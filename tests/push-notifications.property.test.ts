/**
 * Property-Based Tests for Push Notifications
 * Feature: sports-club-management
 * 
 * Property 38: Real-time notification delivery
 * Validates: Requirements 11.5
 * 
 * This test verifies that the notification system can create and deliver
 * notifications to users. It tests the core notification infrastructure
 * without requiring full end-to-end push notification delivery.
 */

import { describe, it, expect, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for testing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Valid notification types from the database enum (actual values in production)
const NOTIFICATION_TYPES = [
  'announcement_published',
  'leave_request_approved',
  'leave_request_rejected',
  'training_session_cancelled',
  'training_session_created',
  'training_session_updated'
] as const;
type NotificationType = typeof NOTIFICATION_TYPES[number];

describe('Push Notifications Property-Based Tests', () => {
  // Track created test data for cleanup
  const testNotificationIds: string[] = [];
  const testUserIds: string[] = [];

  afterAll(async () => {
    // Clean up test notifications
    if (testNotificationIds.length > 0) {
      await supabase.from('notifications').delete().in('id', testNotificationIds);
    }
    // Clean up test users
    for (const userId of testUserIds) {
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {
        // Ignore cleanup errors
      }
    }
  }, 60000);

  /**
   * Feature: sports-club-management, Property 38: Real-time notification delivery
   * 
   * For any announcement or schedule change, users with push notifications enabled 
   * should receive real-time notifications.
   * 
   * Validates: Requirements 11.5
   * 
   * This test verifies:
   * 1. Notifications can be created for users
   * 2. Notifications have correct structure (type, title, message)
   * 3. Notifications are initially unread
   * 4. Notifications have timestamps
   * 5. Users can retrieve their notifications
   */
  it('Property 38: Real-time notification delivery', async () => {
    // Create a test user first
    const testEmail = `test-notif-${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }
    testUserIds.push(authData.user.id);
    const testUserId = authData.user.id;

    // Custom arbitraries for notification data
    const notificationTypeArb = fc.constantFrom(...NOTIFICATION_TYPES);
    const titleArb = fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5);
    const messageArb = fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10);

    const notificationArb = fc.record({
      type: notificationTypeArb,
      title: titleArb,
      message: messageArb,
    });

    await fc.assert(
      fc.asyncProperty(notificationArb, async (notificationData) => {
        // Act: Create notification for the test user
        const { data: notification, error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: testUserId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            link: '/dashboard/athlete/announcements',
          })
          .select()
          .single();

        if (notificationError) {
          throw new Error(`Failed to create notification: ${notificationError.message}`);
        }

        if (notification) {
          testNotificationIds.push(notification.id);
        }

        // Property 1: Notification should be created successfully
        expect(notification).toBeDefined();
        expect(notification.id).toBeDefined();

        // Property 2: Notification should have correct type
        expect(notification.type).toBe(notificationData.type);

        // Property 3: Notification should have correct title
        expect(notification.title).toBe(notificationData.title);

        // Property 4: Notification should have correct message
        expect(notification.message).toBe(notificationData.message);

        // Property 5: Notification should be initially unread
        expect(notification.read).toBe(false);

        // Property 6: Notification should have creation timestamp
        expect(notification.created_at).toBeDefined();
        const creationTime = new Date(notification.created_at);
        // Allow for clock skew between test machine and database server (up to 1 minute)
        expect(creationTime.getTime()).toBeLessThanOrEqual(Date.now() + 60000);

        // Property 7: Notification should be associated with correct user
        expect(notification.user_id).toBe(testUserId);

        // Property 8: User should be able to retrieve their notification
        const { data: retrievedNotifications, error: retrieveError } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', notification.id)
          .single();

        expect(retrieveError).toBeNull();
        expect(retrievedNotifications).toBeDefined();
        expect(retrievedNotifications.id).toBe(notification.id);
      }),
      { numRuns: 10 } // Reduced runs for faster execution
    );
  }, 120000); // 2 minute timeout

  /**
   * Additional property: Notification read status can be updated
   * This verifies that users can mark notifications as read.
   */
  it('Property 38.1: Notifications can be marked as read', async () => {
    // Create a test user
    const testEmail = `test-read-${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }
    testUserIds.push(authData.user.id);
    const testUserId = authData.user.id;

    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...NOTIFICATION_TYPES), async (notificationType) => {
        // Create a notification
        const { data: notification, error: createError } = await supabase
          .from('notifications')
          .insert({
            user_id: testUserId,
            type: notificationType,
            title: 'Test notification',
            message: 'This is a test notification message',
          })
          .select()
          .single();

        if (createError || !notification) {
          throw new Error(`Failed to create notification: ${createError?.message}`);
        }
        testNotificationIds.push(notification.id);

        // Property: Initially unread
        expect(notification.read).toBe(false);

        // Mark as read
        const { data: updatedNotification, error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update notification: ${updateError.message}`);
        }

        // Property: Should now be read
        expect(updatedNotification.read).toBe(true);
      }),
      { numRuns: 5 }
    );
  }, 60000);
});
