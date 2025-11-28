-- ============================================================================
-- Migration 35: Add sport_type column to clubs table
-- ============================================================================
-- This migration adds a sport_type column to the clubs table to support
-- displaying sport type information during club selection in the membership
-- registration process.
--
-- Validates: Task 3.1 - Show club details (name, sport type, coach count)
-- ============================================================================

-- Add sport_type column to clubs table
ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS sport_type VARCHAR(100);

-- Set a default value for existing clubs (can be updated later)
UPDATE clubs
SET sport_type = 'กีฬาทั่วไป'
WHERE sport_type IS NULL;

-- Make sport_type NOT NULL after setting defaults
ALTER TABLE clubs
ALTER COLUMN sport_type SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_clubs_sport_type ON clubs(sport_type);

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clubs' AND column_name = 'sport_type';
