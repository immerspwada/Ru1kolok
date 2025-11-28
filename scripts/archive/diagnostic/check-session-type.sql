-- Check session_type constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'training_sessions'::regclass
AND conname LIKE '%session_type%';
