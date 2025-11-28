-- Setup Cron Job for Session Reminders
-- This script sets up automatic notifications 1 hour before training sessions

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists
SELECT cron.unschedule('session-reminders');

-- Schedule the job to run every 5 minutes
-- This will check for sessions starting in 1 hour and send reminders
SELECT cron.schedule(
  'session-reminders',           -- Job name
  '*/5 * * * *',                 -- Every 5 minutes
  $$SELECT send_session_reminders()$$
);

-- Verify the job was created
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job 
WHERE jobname = 'session-reminders';

-- Check recent job runs (if any)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'session-reminders')
ORDER BY start_time DESC 
LIMIT 5;

-- Note: If you see an error about pg_cron not being available,
-- you need to enable it in Supabase Dashboard:
-- 1. Go to Database > Extensions
-- 2. Search for "pg_cron"
-- 3. Enable it
-- 4. Then run this script again
