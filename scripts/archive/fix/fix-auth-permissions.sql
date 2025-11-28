-- Run this in the Supabase Dashboard SQL Editor to fix Auth permissions

-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant access to tables
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Ensure supabase_auth_admin exists (it should, but just in case)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
  END IF;
END
$$;

-- Grant ownership to supabase_auth_admin (standard Supabase setup)
GRANT ALL PRIVILEGES ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;

-- Verify
SELECT count(*) as user_count FROM auth.users;
