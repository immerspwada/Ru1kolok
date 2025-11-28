-- Get a coach user
DO $$
DECLARE
  v_coach_id UUID;
  v_club_id UUID;
BEGIN
  -- Get first coach
  SELECT id, club_id INTO v_coach_id, v_club_id
  FROM profiles 
  WHERE role = 'coach' 
  LIMIT 1;
  
  IF v_coach_id IS NOT NULL THEN
    -- Create a test tournament
    INSERT INTO tournaments (
      club_id,
      created_by,
      name,
      description,
      tournament_type,
      start_date,
      end_date,
      location,
      status
    ) VALUES (
      v_club_id,
      v_coach_id,
      'ทัวร์นาเมนต์ทดสอบ 2024',
      'การแข่งขันฟุตบอลเยาวชนรายการทดสอบ',
      'competition',
      NOW() + INTERVAL '7 days',
      NOW() + INTERVAL '8 days',
      'กรุงเทพมหานคร',
      'open'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created test tournament for coach % in club %', v_coach_id, v_club_id;
  ELSE
    RAISE NOTICE 'No coach found';
  END IF;
END $$;

-- Show created tournaments
SELECT id, name, tournament_type, status, start_date, club_id
FROM tournaments
ORDER BY created_at DESC
LIMIT 5;
