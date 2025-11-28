-- ============================================================================
-- Migration 36: Update sport types for existing clubs
-- ============================================================================
-- This migration updates the sport_type for existing test clubs to provide
-- more realistic data for testing the club selection feature.
-- ============================================================================

-- Update Test Club A to be Football
UPDATE clubs
SET sport_type = 'ฟุตบอล'
WHERE name = 'Test Club A';

-- Update Test Club B to be Basketball
UPDATE clubs
SET sport_type = 'บาสเกตบอล'
WHERE name = 'Test Club B';

-- Update Test Club for Athletes to be Volleyball
UPDATE clubs
SET sport_type = 'วอลเลย์บอล'
WHERE name = 'Test Club for Athletes';

-- Update Test Sports Club to be General Sports
UPDATE clubs
SET sport_type = 'กีฬาทั่วไป'
WHERE name = 'Test Sports Club';

-- Verify the updates
SELECT name, sport_type, COUNT(*) as count
FROM clubs
GROUP BY name, sport_type
ORDER BY name;
