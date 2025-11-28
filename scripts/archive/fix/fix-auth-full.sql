-- Full Auth Schema Fix
-- Run this in Supabase Dashboard > SQL Editor

-- Grant all permissions to auth schema
GRANT ALL ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant permissions on functions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant permissions on routines
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Ensure default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- Verify
SELECT count(*) as user_count FROM auth.users;
SELECT email FROM auth.users LIMIT 5;
