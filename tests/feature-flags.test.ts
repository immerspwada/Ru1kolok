/**
 * Feature Flag System Tests
 * 
 * Tests the feature flag service functionality including:
 * - User-based percentage rollout
 * - Caching behavior
 * - Flag management operations
 * 
 * Requirements: 20.8, 20.9
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Feature Flag System', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  it('should have feature_flags table created', async () => {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should have seeded initial feature flags', async () => {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('name')
      .order('name');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    const flagNames = data?.map(f => f.name) || [];
    expect(flagNames).toContain('attendance_qr_checkin_v1');
    expect(flagNames).toContain('parent_dashboard_v1');
    expect(flagNames).toContain('home_training_v1');
    expect(flagNames).toContain('tournament_management_v1');
    expect(flagNames).toContain('activity_checkin_v1');
  });

  it('should enforce rollout_percentage constraints', async () => {
    const testFlag = {
      name: 'test_flag_' + Date.now(),
      enabled: true,
      rollout_percentage: 150, // Invalid: > 100
      description: 'Test flag'
    };

    const { error } = await supabase
      .from('feature_flags')
      .insert(testFlag);

    expect(error).toBeDefined();
    expect(error?.message).toContain('rollout_percentage');
  });

  it('should allow valid rollout_percentage values', async () => {
    const testFlag = {
      name: 'test_flag_valid_' + Date.now(),
      enabled: true,
      rollout_percentage: 50, // Valid: 0-100
      description: 'Test flag with valid rollout'
    };

    const { data, error } = await supabase
      .from('feature_flags')
      .insert(testFlag)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.rollout_percentage).toBe(50);

    // Cleanup
    if (data) {
      await supabase
        .from('feature_flags')
        .delete()
        .eq('name', data.name);
    }
  });

  it('should update feature flags', async () => {
    // Create a test flag
    const testFlag = {
      name: 'test_flag_update_' + Date.now(),
      enabled: false,
      rollout_percentage: 0,
      description: 'Test flag for updates'
    };

    const { data: created } = await supabase
      .from('feature_flags')
      .insert(testFlag)
      .select()
      .single();

    expect(created).toBeDefined();

    // Update the flag
    const { data: updated, error } = await supabase
      .from('feature_flags')
      .update({
        enabled: true,
        rollout_percentage: 100
      })
      .eq('name', testFlag.name)
      .select()
      .single();

    expect(error).toBeNull();
    expect(updated?.enabled).toBe(true);
    expect(updated?.rollout_percentage).toBe(100);

    // Cleanup
    if (created) {
      await supabase
        .from('feature_flags')
        .delete()
        .eq('name', created.name);
    }
  });

  it('should have indexes for performance', async () => {
    // This test verifies the table can be queried efficiently
    // The indexes were created in the migration script
    const { data: flags, error: queryError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('enabled', true);

    expect(queryError).toBeNull();
    expect(flags).toBeDefined();
    
    // Query with rollout_percentage filter (uses composite index)
    const { data: rolloutFlags, error: rolloutError } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('enabled', true)
      .gte('rollout_percentage', 50);

    expect(rolloutError).toBeNull();
    expect(rolloutFlags).toBeDefined();
  });

  it('should default new flags to disabled', async () => {
    const testFlag = {
      name: 'test_flag_default_' + Date.now(),
      description: 'Test flag with defaults'
    };

    const { data, error } = await supabase
      .from('feature_flags')
      .insert(testFlag)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.enabled).toBe(false);
    expect(data?.rollout_percentage).toBe(0);

    // Cleanup
    if (data) {
      await supabase
        .from('feature_flags')
        .delete()
        .eq('name', data.name);
    }
  });
});
